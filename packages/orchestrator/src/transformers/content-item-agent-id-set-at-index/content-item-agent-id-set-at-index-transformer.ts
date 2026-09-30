/**
 * PURPOSE: Mutates `entry.message.content[index].agentId` to the supplied value, validating the
 * shape via the normalized-stream-line contract first. Used by tests seeding the eager-stamp
 * pre-condition for `taskToolUseIdsFromContentTransformer`.
 *
 * USAGE:
 * contentItemAgentIdSetAtIndexTransformer({ entry, index: 0, value: 'pre-existing' });
 * // returns `{ success: true }` on stamp, `{ success: false }` if shape was wrong.
 */
import { setResultContract } from '../../contracts/set-result/set-result-contract';
import type { SetResult } from '../../contracts/set-result/set-result-contract';
import {
  normalizedStreamLineContentItemContract,
  type NormalizedStreamLineContentItem,
} from '../../contracts/normalized-stream-line-content-item/normalized-stream-line-content-item-contract';
import {
  normalizedStreamLineContract,
  type NormalizedStreamLine,
} from '../../contracts/normalized-stream-line/normalized-stream-line-contract';


export const contentItemAgentIdSetAtIndexTransformer = ({
  entry,
  index,
  value,
}: {
  entry: unknown;
  index: number;
  value: string;
}): SetResult => {
  // Validate the line shape — guards the cast on the original reference below.
  const lineParse = normalizedStreamLineContract.safeParse(entry);
  if (!lineParse.success) return setResultContract.parse({ success: false });
  // Walk the ORIGINAL entry (mutation must be observed by the caller's reference).
  const original = entry as NormalizedStreamLine;
  const content = original.message?.content;
  if (!Array.isArray(content)) return setResultContract.parse({ success: false });
  const item: unknown = content[index];
  if (item === null || typeof item !== 'object') {
    return setResultContract.parse({ success: false });
  }
  const itemParse = normalizedStreamLineContentItemContract.safeParse(item);
  if (!itemParse.success) return setResultContract.parse({ success: false });
  const mut = item as NormalizedStreamLineContentItem;
  mut.agentId = value as unknown as NormalizedStreamLineContentItem['agentId'];
  return setResultContract.parse({ success: true });
};
