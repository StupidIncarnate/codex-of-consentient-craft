/**
 * PURPOSE: Extracts toolUseId values from tool_result content items in a normalized (camelCase) JSONL entry's message
 *
 * USAGE:
 * toolUseIdsFromContentTransformer({ entry: { message: { content: [{ type: 'tool_result', toolUseId: 'toolu_01X' }] } } });
 * // Returns ['toolu_01X'] as ToolUseId[]
 */

import { toolUseIdContract } from '../../contracts/tool-use-id/tool-use-id-contract';
import type { ToolUseId } from '../../contracts/tool-use-id/tool-use-id-contract';

export const toolUseIdsFromContentTransformer = ({
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
    if (Reflect.get(item, 'type') !== 'tool_result') continue;
    const toolUseId: unknown = Reflect.get(item, 'toolUseId');
    if (typeof toolUseId === 'string') {
      ids.push(toolUseIdContract.parse(toolUseId));
    }
  }

  return ids;
};
