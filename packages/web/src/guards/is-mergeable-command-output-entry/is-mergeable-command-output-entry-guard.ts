/**
 * PURPOSE: Answers whether one chat entry is a plain assistant text line that may be concatenated
 * with its neighbours by `mergeCommandOutputEntriesTransformer`. Split out from that transformer
 * because the rule is applied twice per entry — once to the candidate and once to the head of the
 * run it would join — and because the `usage` clause is the non-obvious half: an entry carrying
 * token accounting is one API call, and `computeTokenAnnotationsTransformer` draws a context
 * divider off it, so absorbing it into a neighbour deletes a divider the reader is owed.
 *
 * USAGE:
 * isMergeableCommandOutputEntryGuard({ entry });
 * // true for a bare assistant text line, false for tool rows, thinking, user turns, any entry
 * //   carrying `usage`, and an absent entry (the end of a run has nothing to extend)
 */

import type { ChatEntry } from '@dungeonmaster/shared/contracts';

export const isMergeableCommandOutputEntryGuard = ({
  entry,
}: {
  // `| undefined` as well as `?` because `exactOptionalPropertyTypes` is on: the caller passes the
  // head of a run, which is genuinely `ChatEntry | undefined`, and `?` alone rejects that.
  entry?: ChatEntry | undefined;
}): boolean =>
  // `type: 'text'` already implies `role: 'assistant'` in the union — a user turn carries no
  // `type` at all — so testing the role as well is a condition the compiler rejects as always true.
  entry !== undefined &&
  'type' in entry &&
  entry.type === 'text' &&
  !('usage' in entry && entry.usage !== undefined);
