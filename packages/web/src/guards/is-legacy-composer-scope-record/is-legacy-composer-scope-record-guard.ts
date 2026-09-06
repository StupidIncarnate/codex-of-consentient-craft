/**
 * PURPOSE: Answers "was this raw IndexedDB record written before per-composer scoping existed?" —
 * a legacy record has no `scopeKey` field at all, which isComposerScopeMatchGuard can never match
 * under any scope. Reach for this to find the records migrateLegacyRecordsLayerAdapter needs to
 * tag; reach for isComposerScopeMatchGuard instead to find records that ALREADY belong to a scope.
 *
 * USAGE:
 * isLegacyComposerScopeRecordGuard({ record: { attachmentId: 'a', mediaType: 'image/png' } });
 * // Returns true — no scopeKey field present
 */

export const isLegacyComposerScopeRecordGuard = ({ record }: { record?: unknown }): boolean =>
  typeof record === 'object' && record !== null && !('scopeKey' in record);
