/**
 * PURPOSE: Reads the `agentId` field from `entry.message.content[index]` of a normalized stream line,
 * returning `undefined` when any part of the path is absent or the wrong shape.
 *
 * USAGE:
 * const id = contentItemAgentIdAtIndexTransformer({ entry, index: 0 });
 * // returns the agentId string set by the eager-stamp side effect, or undefined
 *
 * Used by tests asserting the side effect of `taskToolUseIdsFromContentTransformer` without
 * reaching into the line via Reflect.get.
 */
import {
  normalizedStreamLineContentItemContract,
  type NormalizedStreamLineContentItem,
} from '../../contracts/normalized-stream-line-content-item/normalized-stream-line-content-item-contract';
import { normalizedStreamLineContract } from '../../contracts/normalized-stream-line/normalized-stream-line-contract';

export const contentItemAgentIdAtIndexTransformer = ({
  entry,
  index,
}: {
  entry: unknown;
  index: number;
}): NormalizedStreamLineContentItem['agentId'] => {
  const lineParse = normalizedStreamLineContract.safeParse(entry);
  if (!lineParse.success) return undefined;
  const content = lineParse.data.message?.content;
  if (!Array.isArray(content)) return undefined;
  const itemParse = normalizedStreamLineContentItemContract.safeParse(content[index]);
  if (!itemParse.success) return undefined;
  return itemParse.data.agentId;
};
