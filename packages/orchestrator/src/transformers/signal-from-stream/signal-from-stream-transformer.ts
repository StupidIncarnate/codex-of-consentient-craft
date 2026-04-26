/**
 * PURPOSE: Extracts signal-back MCP tool call data from a normalized (camelCase) Claude stream-json line object
 *
 * USAGE:
 * signalFromStreamTransformer({ parsed: {type:'assistant', message:{content:[{type:'tool_use', name:'mcp__dungeonmaster__signal-back', input:{...}}]}} });
 * // Returns StreamSignal if found, null otherwise
 */

import { normalizedStreamLineContentItemContract } from '../../contracts/normalized-stream-line-content-item/normalized-stream-line-content-item-contract';
import { normalizedStreamLineContract } from '../../contracts/normalized-stream-line/normalized-stream-line-contract';
import {
  streamSignalContract,
  type StreamSignal,
} from '../../contracts/stream-signal/stream-signal-contract';

const SIGNAL_BACK_TOOL_NAME = 'mcp__dungeonmaster__signal-back';

export const signalFromStreamTransformer = ({
  parsed,
}: {
  parsed: unknown;
}): StreamSignal | null => {
  const lineParse = normalizedStreamLineContract.safeParse(parsed);
  if (!lineParse.success) {
    return null;
  }
  const line = lineParse.data;
  if (line.type !== 'assistant') {
    return null;
  }

  const content = line.message?.content;
  if (!Array.isArray(content)) {
    return null;
  }

  for (const rawItem of content) {
    const itemParse = normalizedStreamLineContentItemContract.safeParse(rawItem);
    if (!itemParse.success) continue;
    const item = itemParse.data;
    if (item.type !== 'tool_use' || item.name !== SIGNAL_BACK_TOOL_NAME) continue;
    const parseResult = streamSignalContract.safeParse(item.input);
    if (parseResult.success) {
      return parseResult.data;
    }
  }

  return null;
};
