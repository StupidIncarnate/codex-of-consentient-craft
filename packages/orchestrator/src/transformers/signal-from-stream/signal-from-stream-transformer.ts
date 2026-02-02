/**
 * PURPOSE: Extracts signal-back MCP tool call data from a Claude stream-json output line
 *
 * USAGE:
 * signalFromStreamTransformer({ line: StreamJsonLineStub({ value: '{"type":"assistant","message":{"content":[{"type":"tool_use","name":"mcp__dungeonmaster__signal-back","input":{...}}]}}' }) });
 * // Returns StreamSignal if found, null otherwise
 */

import type { StreamJsonLine } from '../../contracts/stream-json-line/stream-json-line-contract';
import {
  streamSignalContract,
  type StreamSignal,
} from '../../contracts/stream-signal/stream-signal-contract';

const SIGNAL_BACK_TOOL_NAME = 'mcp__dungeonmaster__signal-back';

export const signalFromStreamTransformer = ({
  line,
}: {
  line: StreamJsonLine;
}): StreamSignal | null => {
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

    // Find signal-back tool use in content
    for (const item of content) {
      if (
        typeof item === 'object' &&
        item !== null &&
        'type' in item &&
        Reflect.get(item, 'type') === 'tool_use' &&
        'name' in item &&
        Reflect.get(item, 'name') === SIGNAL_BACK_TOOL_NAME &&
        'input' in item
      ) {
        const input: unknown = Reflect.get(item, 'input');
        const parseResult = streamSignalContract.safeParse(input);
        if (parseResult.success) {
          return parseResult.data;
        }
      }
    }

    return null;
  } catch {
    return null;
  }
};
