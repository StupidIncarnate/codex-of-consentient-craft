/**
 * PURPOSE: Answers "does this raw IndexedDB record belong to this composer's draft?" against
 * completely unvalidated data — a sibling composer's record parses successfully under
 * pastedImageDraftContract too, so a full-contract parse alone cannot tell them apart. Reach for
 * this before pastedImageDraftContract.safeParse whenever a record from a SHARED object store
 * needs to be filtered down to one scope first; parse only the records this returns true for.
 *
 * USAGE:
 * isComposerScopeMatchGuard({ record: rawIndexedDbRecord, scopeKey: 'quest-a' });
 * // Returns true when record.scopeKey === 'quest-a', false otherwise (including a pre-scoping
 * // record with no scopeKey field at all)
 */

import type { ComposerScopeKey } from '../../contracts/composer-scope-key/composer-scope-key-contract';

export const isComposerScopeMatchGuard = ({
  record,
  scopeKey,
}: {
  record?: unknown;
  scopeKey?: ComposerScopeKey;
}): boolean => {
  if (typeof record !== 'object' || record === null) return false;
  return 'scopeKey' in record && Reflect.get(record, 'scopeKey') === scopeKey;
};
