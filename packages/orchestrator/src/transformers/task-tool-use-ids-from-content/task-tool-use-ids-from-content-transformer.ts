/**
 * PURPOSE: Extracts tool_use ID values from Task tool_use content items in an assistant JSONL entry's message
 *
 * USAGE:
 * taskToolUseIdsFromContentTransformer({ entry: { message: { content: [{ type: 'tool_use', name: 'Task', id: 'toolu_01X' }] } } });
 * // Returns ['toolu_01X'] as ToolUseId[]
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
    if (Reflect.get(item, 'name') !== 'Task') continue;
    const id: unknown = Reflect.get(item, 'id');
    if (typeof id === 'string') {
      ids.push(toolUseIdContract.parse(id));
    }
  }

  return ids;
};
