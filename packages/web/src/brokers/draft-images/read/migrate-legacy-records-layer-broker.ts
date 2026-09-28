/**
 * PURPOSE: One-time upgrade for a record written before per-composer scoping existed — it has no
 * `scopeKey` field at all, so isComposerScopeMatchGuard can never match it under any scope, and it
 * would otherwise sit in the store forever, invisible to every future read. Reach for this only
 * from the CREATE-scope read path: a legacy record predates quest-scoped drafts entirely, so the
 * create surface's own sentinel is the only scope it can join without risking a collision with a
 * real quest's own draft.
 *
 * USAGE:
 * await migrateLegacyRecordsLayerBroker({ db, storeName: 'dungeonmaster-chat-draft-images' });
 * // Returns AdapterResult. Tags every scopeKey-less record in the store with the create-surface
 * // scope, in one transaction; a no-op (no write transaction opened) when none exist
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { getAll, replaceAll } from '#gateway/browser/indexedDB';

import { isLegacyComposerScopeRecordGuard } from '../../../guards/is-legacy-composer-scope-record/is-legacy-composer-scope-record-guard';
import { chatComposerStatics } from '../../../statics/chat-composer/chat-composer-statics';

export const migrateLegacyRecordsLayerBroker = async ({
  db,
  storeName,
}: {
  db: IDBDatabase;
  storeName: string;
}): Promise<AdapterResult> => {
  const existing = await getAll({ db, storeName });

  const hasLegacyRecords = existing.some((record) => isLegacyComposerScopeRecordGuard({ record }));
  if (!hasLegacyRecords) return { success: true as const };

  await replaceAll({
    db,
    storeName,
    replace: ({ existing: current }) =>
      current.map((record) => {
        if (
          !isLegacyComposerScopeRecordGuard({ record }) ||
          typeof record !== 'object' ||
          record === null
        ) {
          return record;
        }
        return { ...record, scopeKey: chatComposerStatics.draftScope.createScopeKey };
      }),
  });

  return { success: true as const };
};
