/**
 * PURPOSE: Replaces ONE composer's slice of the shared draft-images object store in one
 * transaction — see pastedImageDraftContract's header for why the bytes live in IndexedDB rather
 * than beside the text draft in localStorage. Reach for this over a targeted add/delete whenever a
 * paste or a delete changes which images belong to the draft: the text draft's [Pasted Image N]
 * placeholders are the only source of truth for ORDER, and a paste can land BETWEEN two existing
 * images, so insertion order and placeholder order diverge the moment anything but a plain append
 * happens. Every OTHER scope's records ride through untouched (read back via getAll, then
 * re-added alongside this scope's fresh set) — see isComposerScopeMatchGuard's header for why a
 * bare store.clear() would otherwise wipe every composer's drafts at once, not just this one's. A
 * database already at the app's expected version but missing the store heals itself here the same
 * way indexedDbDraftImagesReadAdapter does — see the comment beside that reopen below.
 *
 * USAGE:
 * await indexedDbDraftImagesReplaceAdapter({ scopeKey: 'quest-a', drafts: [firstDraft, secondDraft] });
 * // Returns: AdapterResult — quest-a's slice of the store now holds exactly these two records, in
 * // this order; every other scope's records are untouched
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import type { ComposerScopeKey } from '../../../contracts/composer-scope-key/composer-scope-key-contract';
import type { PastedImageDraft } from '../../../contracts/pasted-image-draft/pasted-image-draft-contract';
import { isComposerScopeMatchGuard } from '../../../guards/is-composer-scope-match/is-composer-scope-match-guard';
import { chatComposerStatics } from '../../../statics/chat-composer/chat-composer-statics';

export const indexedDbDraftImagesReplaceAdapter = async ({
  scopeKey,
  drafts,
}: {
  scopeKey: ComposerScopeKey;
  drafts: readonly PastedImageDraft[];
}): Promise<AdapterResult> => {
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
      // Same reasoning as indexedDbDraftImagesReadAdapter's own fallback: a PRIOR heal can have
      // bumped this database's on-disk version past the app's own static `version`, so a later
      // open at that now-stale, LOWER version fails with VersionError instead of attaching at the
      // higher one. Falling back to a version-LESS open is what keeps a save working durably after
      // the first heal, rather than turning a healed store into a permanently loud open failure.
      if (openRequest.error?.name === 'VersionError') {
        const fallbackRequest = globalThis.indexedDB.open(name);

        fallbackRequest.onsuccess = (): void => {
          resolve(fallbackRequest.result);
        };

        fallbackRequest.onerror = (): void => {
          reject(
            new Error(
              `indexedDbDraftImagesReplaceAdapter: failed to open ${name} at its current version — ${fallbackRequest.error?.message ?? 'unknown error'}`,
            ),
          );
        };
        return;
      }

      reject(
        new Error(
          `indexedDbDraftImagesReplaceAdapter: failed to open ${name} — ${openRequest.error?.message ?? 'unknown error'}`,
        ),
      );
    };
  });

  // Same reasoning as indexedDbDraftImagesReadAdapter's own reopen: IndexedDB only fires
  // `onupgradeneeded` when the requested version is HIGHER than the database's current one, so a
  // database already at `version` but missing the store never gets another chance to create it on
  // a same-version open. Reopening one version ahead forces that upgrade transaction to run again,
  // which is what lets a save recover the store on its own rather than failing silently forever.
  // The ternary resolves straight to `openedDb`, with no second open, whenever `storeName` is
  // already present. A single `const` (rather than reassigning `openedDb`) is deliberate:
  // reassigning the same binding across the `await` below trips `require-atomic-updates`.
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
              `indexedDbDraftImagesReplaceAdapter: failed to heal missing store on ${name} — ${reopenRequest.error?.message ?? 'unknown error'}`,
            ),
          );
        };
      })
    : openedDb;

  await new Promise<void>((resolve, reject) => {
    // Clear-then-add, in ONE transaction, every time — never a targeted patch. See the header:
    // insertion order alone cannot be trusted to match the placeholder order once a paste lands
    // between two existing images, so rewriting the whole store in text order is what keeps
    // getAll() and the placeholders lined up. This only runs on a paste or a delete, never on a
    // keystroke. Read-then-clear-then-add rather than a plain clear: every OTHER scope's records
    // are read back first so they can be re-added alongside this scope's fresh set — see the
    // PURPOSE header above for why a bare clear() is not scope-safe.
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const getAllRequest = store.getAll();

    getAllRequest.onsuccess = (): void => {
      const otherScopesRecords = getAllRequest.result.filter(
        (record: unknown) => !isComposerScopeMatchGuard({ record, scopeKey }),
      );

      store.clear();
      for (const record of otherScopesRecords) {
        store.add(record);
      }
      for (const draft of drafts) {
        store.add(draft);
      }
    };

    getAllRequest.onerror = (): void => {
      reject(
        new Error(
          `indexedDbDraftImagesReplaceAdapter: failed to read store before replacing it — ${getAllRequest.error?.message ?? 'unknown error'}`,
        ),
      );
    };

    transaction.oncomplete = (): void => {
      resolve();
    };

    transaction.onerror = (): void => {
      reject(
        new Error(
          `indexedDbDraftImagesReplaceAdapter: failed to replace store — ${transaction.error?.message ?? 'unknown error'}`,
        ),
      );
    };
  });

  db.close();

  return { success: true as const };
};
