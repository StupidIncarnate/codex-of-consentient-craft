/**
 * PURPOSE: Extracts tool_use ID values from Task/Agent tool_use content items in an assistant JSONL entry's message. As a side effect, eagerly stamps `agentId = item.id` on each matched content item — that's the wire-level correlation key that will later match sub-agent lines tagged with `parent_tool_use_id = <this id>`. Without this eager stamping, the Task tool_use ChatEntry ships to the web with no agentId and chain grouping fails until tool_use_result arrives (too late for real-time streaming).
 *
 * USAGE:
 * taskToolUseIdsFromContentTransformer({ entry: { message: { content: [{ type: 'tool_use', name: 'Task', id: 'toolu_01X' }] } } });
 * // Returns ['toolu_01X'] as ToolUseId[]. The matching item is mutated with agentId = 'toolu_01X'.
 */

import {
  normalizedStreamLineContentItemContract,
  type NormalizedStreamLineContentItem,
} from '../../contracts/normalized-stream-line-content-item/normalized-stream-line-content-item-contract';
import {
  normalizedStreamLineContract,
  type NormalizedStreamLine,
} from '../../contracts/normalized-stream-line/normalized-stream-line-contract';
import { toolUseIdContract } from '../../contracts/tool-use-id/tool-use-id-contract';
import type { ToolUseId } from '../../contracts/tool-use-id/tool-use-id-contract';

export const taskToolUseIdsFromContentTransformer = ({
  entry,
}: {
  entry: unknown;
}): ToolUseId[] => {
  // Validate the line shape first; if invalid, nothing to extract.
  const lineParse = normalizedStreamLineContract.safeParse(entry);
  if (!lineParse.success) {
    return [];
  }

  // After validation, walk the ORIGINAL entry's content array (not the parsed copy)
  // so the eager `agentId` stamping on each tool_use item lands on the same object
  // reference downstream consumers hold via `parsed` in chat-line-process-transformer.
  // The cast to `NormalizedStreamLine` is sound because `lineParse.success` confirmed it.
  const originalContent = (entry as NormalizedStreamLine).message?.content;
  if (!Array.isArray(originalContent)) {
    return [];
  }

  const ids: ToolUseId[] = [];
  for (const rawItem of originalContent) {
    const itemParse = normalizedStreamLineContentItemContract.safeParse(rawItem);
    if (!itemParse.success) continue;
    const item = itemParse.data;
    if (item.type !== 'tool_use') continue;
    if (item.name !== 'Task' && item.name !== 'Agent') continue;
    if (typeof item.id !== 'string') continue;
    const parsedId = toolUseIdContract.parse(String(item.id));
    ids.push(parsedId);
    if (typeof item.agentId !== 'string' || String(item.agentId).length === 0) {
      const mutTarget = rawItem as NormalizedStreamLineContentItem;
      mutTarget.agentId = parsedId as unknown as NormalizedStreamLineContentItem['agentId'];
    }
  }

  return ids;
};
