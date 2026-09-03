/**
 * PURPOSE: Reads every draft image back out of IndexedDB on reload — see
 * pastedImageDraftContract's header for why the bytes live there rather than beside the text
 * draft in localStorage. A record that fails to parse is data a previous version of the app left
 * on the user's disk; it occupies a HOLE (`undefined`) at its own position rather than being
 * dropped, because draftImagesLoadBroker and composerParseDraftTransformer both index this array
 * POSITIONALLY against the Nth `[Pasted Image N]` placeholder in the localStorage text draft —
 * compacting a failed record here would shift every later record onto the wrong placeholder. A
 * database that already sits at the app's expected version but is missing the store entirely
 * (corrupted, deleted by hand, or created by a decoy schema) heals itself here by reopening one
 * version ahead — see the comment beside that reopen below for why a same-version open can never
 * do this on its own.
 *
 * USAGE:
 * const drafts = await indexedDbDraftImagesReadAdapter();
 * // Returns: readonly (PastedImageDraft | undefined)[] — one entry per stored record, in getAll()
 * // order; a record that fails to parse is `undefined` at its own index rather than absent
 */

import { chatComposerStatics } from '../../../statics/chat-composer/chat-composer-statics';
import { pastedImageDraftContract } from '../../../contracts/pasted-image-draft/pasted-image-draft-contract';
import type { PastedImageDraft } from '../../../contracts/pasted-image-draft/pasted-image-draft-contract';

export const indexedDbDraftImagesReadAdapter = async (): Promise<
  readonly (PastedImageDraft | undefined)[]
> => {
  const { name, version, storeName } = chatComposerStatics.draftDatabase;

  const openedDb = await new Promise<IDBDatabase>((resolve, reject) => {
    const openRequest = globalThis.indexedDB.open(name, version);

    openRequest.onupgradeneeded = (): void => {
      const database = openRequest.result;
      if (!database.objectStoreNames.contains(storeName)) {
        database.createObjectStore(storeName, { autoIncrement: true });
      }
    };

    openRequest.onsuccess = (): void => {
      resolve(openRequest.result);
    };

    openRequest.onerror = (): void => {
      // A PRIOR heal (see the reopen below) can have bumped this database's on-disk version past
      // the app's own static `version` — a later open requesting that now-stale, LOWER version
      // fails outright with VersionError rather than attaching at the higher one. Falling back to
      // a version-LESS open here is what makes the heal durable across repeat calls and future
      // sessions, instead of trading one silent failure for a permanent loud one on every open
      // after the first heal.
      if (openRequest.error?.name === 'VersionError') {
        const fallbackRequest = globalThis.indexedDB.open(name);

        fallbackRequest.onsuccess = (): void => {
          resolve(fallbackRequest.result);
        };

        fallbackRequest.onerror = (): void => {
          reject(
            new Error(
              `indexedDbDraftImagesReadAdapter: failed to open ${name} at its current version — ${fallbackRequest.error?.message ?? 'unknown error'}`,
            ),
          );
        };
        return;
      }

      reject(
        new Error(
          `indexedDbDraftImagesReadAdapter: failed to open ${name} — ${openRequest.error?.message ?? 'unknown error'}`,
        ),
      );
    };
  });

  // IndexedDB only runs `onupgradeneeded` when the requested version is HIGHER than the
  // database's current one — a database that already sits at `version` but lost its store (the
  // store was deleted directly, or the database was created by something other than this app)
  // never gets another chance to run the create-store branch above on a same-version open, and
  // would otherwise stay broken until a human clears storage by hand. Reopening one version ahead
  // is what forces the browser to run the upgrade transaction again, so the missing store heals on
  // the very read that discovers it. This never touches an already-healthy database: the ternary
  // below resolves to `openedDb` itself, with no second open, whenever `storeName` is already
  // present. A single `const` (rather than reassigning `openedDb`) is deliberate: reassigning the
  // same binding across the `await` below trips `require-atomic-updates`.
  const needsStoreHeal = !openedDb.objectStoreNames.contains(storeName);
  const db: IDBDatabase = needsStoreHeal
    ? await new Promise<IDBDatabase>((resolve, reject) => {
        const healVersion = openedDb.version + 1;
        openedDb.close();

        const reopenRequest = globalThis.indexedDB.open(name, healVersion);

        reopenRequest.onupgradeneeded = (): void => {
          const database = reopenRequest.result;
          if (!database.objectStoreNames.contains(storeName)) {
            database.createObjectStore(storeName, { autoIncrement: true });
          }
        };

        reopenRequest.onsuccess = (): void => {
          resolve(reopenRequest.result);
        };

        reopenRequest.onerror = (): void => {
          reject(
            new Error(
              `indexedDbDraftImagesReadAdapter: failed to heal missing store on ${name} — ${reopenRequest.error?.message ?? 'unknown error'}`,
            ),
          );
        };
      })
    : openedDb;

  const records = await new Promise<unknown[]>((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const getAllRequest = store.getAll();

    getAllRequest.onsuccess = (): void => {
      resolve(getAllRequest.result);
    };

    getAllRequest.onerror = (): void => {
      reject(
        new Error(
          `indexedDbDraftImagesReadAdapter: failed to read store — ${getAllRequest.error?.message ?? 'unknown error'}`,
        ),
      );
    };
  });

  db.close();

  // A record that fails pastedImageDraftContract is data a previous version of the app left on
  // disk. It is mapped to a HOLE at its own index rather than dropped — see the PURPOSE header
  // above for why compacting here mis-addresses every record that follows a bad one.
  return records.map((record) => {
    const parsed = pastedImageDraftContract.safeParse(record);
    return parsed.success ? parsed.data : undefined;
  });
};
