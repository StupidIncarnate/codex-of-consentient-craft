/**
 * PURPOSE: One-time upgrade for a record written before per-composer scoping existed — it has no
 * `scopeKey` field at all, so isComposerScopeMatchGuard can never match it under any scope, and it
 * would otherwise sit in the store forever, invisible to every future read. Reach for this only
 * from the CREATE-scope read path: a legacy record predates quest-scoped drafts entirely, so the
 * create surface's own sentinel is the only scope it can join without risking a collision with a
 * real quest's own draft.
 *
 * USAGE:
 * await migrateLegacyRecordsLayerAdapter({ db, storeName: 'dungeonmaster-chat-draft-images' });
 * // Returns AdapterResult. Tags every scopeKey-less record in the store with the create-surface
 * // scope, in one transaction; a no-op (no transaction opened) when none exist
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { isLegacyComposerScopeRecordGuard } from '../../../guards/is-legacy-composer-scope-record/is-legacy-composer-scope-record-guard';
import { chatComposerStatics } from '../../../statics/chat-composer/chat-composer-statics';

export const migrateLegacyRecordsLayerAdapter = async ({
  db,
  storeName,
}: {
  db: IDBDatabase;
  storeName: string;
}): Promise<AdapterResult> => {
  const existing = await new Promise<unknown[]>((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const getAllRequest = store.getAll();

    getAllRequest.onsuccess = (): void => {
      resolve(getAllRequest.result);
    };

    getAllRequest.onerror = (): void => {
      reject(
        new Error(
          `migrateLegacyRecordsLayerAdapter: failed to read store — ${getAllRequest.error?.message ?? 'unknown error'}`,
        ),
      );
    };
  });

  const hasLegacyRecords = existing.some((record) => isLegacyComposerScopeRecordGuard({ record }));
  if (!hasLegacyRecords) return { success: true as const };

  const migratedRecords = existing.map((record) => {
    if (
      !isLegacyComposerScopeRecordGuard({ record }) ||
      typeof record !== 'object' ||
      record === null
    ) {
      return record;
    }
    return { ...record, scopeKey: chatComposerStatics.draftScope.createScopeKey };
  });

  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    store.clear();
    for (const record of migratedRecords) {
      store.add(record);
    }

    transaction.oncomplete = (): void => {
      resolve();
    };

    transaction.onerror = (): void => {
      reject(
        new Error(
          `migrateLegacyRecordsLayerAdapter: failed to migrate legacy records — ${transaction.error?.message ?? 'unknown error'}`,
        ),
      );
    };
  });

  return { success: true as const };
};
