/**
 * PURPOSE: Extracts toolUseId values from tool_result content items in a normalized (camelCase) JSONL entry's message
 *
 * USAGE:
 * toolUseIdsFromContentTransformer({ entry: { message: { content: [{ type: 'tool_result', toolUseId: 'toolu_01X' }] } } });
 * // Returns ['toolu_01X']
 */

import { normalizedStreamLineContentItemContract } from '../../contracts/normalized-stream-line-content-item/normalized-stream-line-content-item-contract';
import { normalizedStreamLineContract } from '../../contracts/normalized-stream-line/normalized-stream-line-contract';

export const toolUseIdsFromContentTransformer = ({ entry }: { entry: unknown }): string[] => {
  const lineParse = normalizedStreamLineContract.safeParse(entry);
  if (!lineParse.success) {
    return [];
  }
  const content = lineParse.data.message?.content;
  if (!Array.isArray(content)) {
    return [];
  }

  const ids: string[] = [];
  for (const rawItem of content) {
    const itemParse = normalizedStreamLineContentItemContract.safeParse(rawItem);
    if (!itemParse.success) continue;
    const item = itemParse.data;
    if (item.type !== 'tool_result') continue;
    if (typeof item.toolUseId === 'string') {
      ids.push(item.toolUseId);
    }
  }

  return ids;
};
