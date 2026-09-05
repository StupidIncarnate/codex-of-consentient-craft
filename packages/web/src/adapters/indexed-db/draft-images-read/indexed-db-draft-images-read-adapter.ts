/**
 * PURPOSE: Reads back the draft images belonging to ONE composer's scope out of the shared
 * IndexedDB store on reload — see pastedImageDraftContract's header for why the bytes live there
 * rather than beside the text draft in localStorage, and isComposerScopeMatchGuard's header for
 * why a record belonging to a DIFFERENT scope is excluded outright rather than becoming a hole. A
 * record that carries this scope but fails to parse is data a previous version of the app left on
 * the user's disk; it occupies a HOLE (`undefined`) at its own position rather than being dropped,
 * because draftImagesLoadBroker and composerParseDraftTransformer both index this array
 * POSITIONALLY against the Nth `[Pasted Image N]` placeholder in the localStorage text draft —
 * compacting a failed record here would shift every later record onto the wrong placeholder. A
 * database that already sits at the app's expected version but is missing the store entirely
 * (corrupted, deleted by hand, or created by a decoy schema) heals itself here by reopening one
 * version ahead — see the comment beside that reopen below for why a same-version open can never
 * do this on its own. A CREATE-scope read additionally migrates any pre-scoping record (one with
 * no `scopeKey` field at all, written before per-composer scoping existed) into the create scope
 * once — see migrateLegacyRecordsLayerAdapter's header for why the create surface is the only
 * scope that migration can safely target.
 *
 * USAGE:
 * const drafts = await indexedDbDraftImagesReadAdapter({ scopeKey: 'quest-a' });
 * // Returns: readonly (PastedImageDraft | undefined)[] — one entry per record in THIS scope, in
 * // getAll() order; a same-scope record that fails to parse is `undefined` at its own index
 * // rather than absent, and a different-scope record is silently excluded (not a hole)
 */

import { chatComposerStatics } from '../../../statics/chat-composer/chat-composer-statics';
import { pastedImageDraftContract } from '../../../contracts/pasted-image-draft/pasted-image-draft-contract';
import type { PastedImageDraft } from '../../../contracts/pasted-image-draft/pasted-image-draft-contract';
import type { ComposerScopeKey } from '../../../contracts/composer-scope-key/composer-scope-key-contract';
import { isComposerScopeMatchGuard } from '../../../guards/is-composer-scope-match/is-composer-scope-match-guard';
import { migrateLegacyRecordsLayerAdapter } from './migrate-legacy-records-layer-adapter';

export const indexedDbDraftImagesReadAdapter = async ({
  scopeKey,
}: {
  scopeKey: ComposerScopeKey;
}): Promise<readonly (PastedImageDraft | undefined)[]> => {
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

  // Only the create surface can safely adopt a pre-scoping record — see
  // migrateLegacyRecordsLayerAdapter's header for why. A quest-scoped read never runs this: a
  // legacy record cannot be tied to any specific quest, so leaving it for the create-scope read to
  // find is the only safe outcome for a non-create scope.
  if (scopeKey === chatComposerStatics.draftScope.createScopeKey) {
    await migrateLegacyRecordsLayerAdapter({ db, storeName });
  }

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

  // A record belonging to a DIFFERENT scope is silently excluded — see
  // isComposerScopeMatchGuard's header for why a full-contract parse alone cannot tell scopes
  // apart. Among records that DO match, one that fails pastedImageDraftContract is data a previous
  // version of the app left on the user's disk; it is mapped to a HOLE at its own index rather
  // than dropped — see the PURPOSE header above for why compacting here mis-addresses every record
  // that follows a bad one.
  return records.reduce<(PastedImageDraft | undefined)[]>((accumulated, record) => {
    if (!isComposerScopeMatchGuard({ record, scopeKey })) return accumulated;
    const parsed = pastedImageDraftContract.safeParse(record);
    accumulated.push(parsed.success ? parsed.data : undefined);
    return accumulated;
  }, []);
};
