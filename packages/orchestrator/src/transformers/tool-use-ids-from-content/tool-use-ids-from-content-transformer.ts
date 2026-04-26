/**
 * PURPOSE: Extracts toolUseId values from tool_result content items in a normalized (camelCase) JSONL entry's message
 *
 * USAGE:
 * toolUseIdsFromContentTransformer({ entry: { message: { content: [{ type: 'tool_result', toolUseId: 'toolu_01X' }] } } });
 * // Returns ['toolu_01X'] as ToolUseId[]
 */

import { normalizedStreamLineContentItemContract } from '../../contracts/normalized-stream-line-content-item/normalized-stream-line-content-item-contract';
import { normalizedStreamLineContract } from '../../contracts/normalized-stream-line/normalized-stream-line-contract';
import { toolUseIdContract } from '../../contracts/tool-use-id/tool-use-id-contract';
import type { ToolUseId } from '../../contracts/tool-use-id/tool-use-id-contract';

export const toolUseIdsFromContentTransformer = ({ entry }: { entry: unknown }): ToolUseId[] => {
  const lineParse = normalizedStreamLineContract.safeParse(entry);
  if (!lineParse.success) {
    return [];
  }
  const content = lineParse.data.message?.content;
  if (!Array.isArray(content)) {
    return [];
  }

  const ids: ToolUseId[] = [];
  for (const rawItem of content) {
    const itemParse = normalizedStreamLineContentItemContract.safeParse(rawItem);
    if (!itemParse.success) continue;
    const item = itemParse.data;
    if (item.type !== 'tool_result') continue;
    if (typeof item.toolUseId === 'string') {
      ids.push(toolUseIdContract.parse(String(item.toolUseId)));
    }
  }

  return ids;
};
