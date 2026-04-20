/**
 * PURPOSE: Extracts tool_use ID values from Task/Agent tool_use content items in an assistant JSONL entry's message. As a side effect, eagerly stamps `agentId = item.id` on each matched content item — that's the wire-level correlation key that will later match sub-agent lines tagged with `parent_tool_use_id = <this id>`. Without this eager stamping, the Task tool_use ChatEntry ships to the web with no agentId and chain grouping fails until tool_use_result arrives (too late for real-time streaming).
 *
 * USAGE:
 * taskToolUseIdsFromContentTransformer({ entry: { message: { content: [{ type: 'tool_use', name: 'Task', id: 'toolu_01X' }] } } });
 * // Returns ['toolu_01X'] as ToolUseId[]. The matching item is mutated with agentId = 'toolu_01X'.
 */

import { toolUseIdContract } from '../../contracts/tool-use-id/tool-use-id-contract';
import type { ToolUseId } from '../../contracts/tool-use-id/tool-use-id-contract';

export const taskToolUseIdsFromContentTransformer = ({
  entry,
}: {
  entry: Record<string, unknown>;
}): ToolUseId[] => {
  const message: unknown = Reflect.get(entry, 'message');
  if (typeof message !== 'object' || message === null) {
    return [];
  }

  const content: unknown = Reflect.get(message, 'content');
  if (!Array.isArray(content)) {
    return [];
  }

  const ids: ToolUseId[] = [];
  for (const item of content) {
    if (typeof item !== 'object' || item === null) continue;
    if (Reflect.get(item, 'type') !== 'tool_use') continue;
    const itemName: unknown = Reflect.get(item, 'name');
    if (itemName !== 'Task' && itemName !== 'Agent') continue;
    const id: unknown = Reflect.get(item, 'id');
    if (typeof id !== 'string') continue;
    const parsedId = toolUseIdContract.parse(id);
    ids.push(parsedId);
    const existingAgentId: unknown = Reflect.get(item, 'agentId');
    if (typeof existingAgentId !== 'string' || existingAgentId.length === 0) {
      Reflect.set(item, 'agentId', parsedId);
    }
  }

  return ids;
};
