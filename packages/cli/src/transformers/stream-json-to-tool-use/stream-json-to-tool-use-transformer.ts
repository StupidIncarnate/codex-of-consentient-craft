/**
 * PURPOSE: Extracts tool_use content from a Claude stream-json output line and formats for display
 *
 * USAGE:
 * streamJsonToToolUseTransformer({ line: StreamJsonLineStub({ value: '{"type":"assistant","message":{"content":[{"type":"tool_use","name":"Task","input":{}}]}}' }) });
 * // Returns ToolUseDisplay if tool_use found, null otherwise
 */

import type { StreamJsonLine } from '../../contracts/stream-json-line/stream-json-line-contract';
import {
  toolUseDisplayContract,
  type ToolUseDisplay,
} from '../../contracts/tool-use-display/tool-use-display-contract';

export const streamJsonToToolUseTransformer = ({
  line,
}: {
  line: StreamJsonLine;
}): ToolUseDisplay | null => {
  try {
    const parsed: unknown = JSON.parse(line);

    // Check if this is an assistant message
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('type' in parsed) ||
      Reflect.get(parsed, 'type') !== 'assistant'
    ) {
      return null;
    }

    // Get message content
    const message: unknown = Reflect.get(parsed, 'message');
    if (typeof message !== 'object' || message === null || !('content' in message)) {
      return null;
    }

    const content: unknown = Reflect.get(message, 'content');
    if (!Array.isArray(content)) {
      return null;
    }

    // Collect tool_use names using reduce to build display string directly
    const result = content.reduce<ToolUseDisplay | null>((acc, item) => {
      if (
        typeof item === 'object' &&
        item !== null &&
        'type' in item &&
        Reflect.get(item, 'type') === 'tool_use' &&
        'name' in item
      ) {
        const name: unknown = Reflect.get(item, 'name');
        if (typeof name === 'string') {
          const formatted = `[${name}]`;
          const current = acc === null ? '' : `${acc.replace(/\n$/u, '')} `;
          return toolUseDisplayContract.parse(`${current}${formatted}\n`);
        }
      }
      return acc;
    }, null);

    return result;
  } catch {
    return null;
  }
};
