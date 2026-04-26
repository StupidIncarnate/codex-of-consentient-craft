/**
 * PURPOSE: Parses a single stream-json parsed object into chat entries and optional session ID
 *
 * USAGE:
 * streamJsonToChatEntryTransformer({parsed: {type: 'assistant', message: {content: [{type: 'text', text: 'hi'}]}}});
 * // Returns {entries: [{role: 'assistant', type: 'text', content: 'hi'}], sessionId: null}
 */
import { normalizedStreamLineContract } from '../../contracts/normalized-stream-line/normalized-stream-line-contract';
import { streamJsonResultContract } from '../../contracts/stream-json-result/stream-json-result-contract';
import type { StreamJsonResult } from '../../contracts/stream-json-result/stream-json-result-contract';
import { parseAssistantStreamEntryTransformer } from '../parse-assistant-stream-entry/parse-assistant-stream-entry-transformer';
import { parseUserStreamEntryTransformer } from '../parse-user-stream-entry/parse-user-stream-entry-transformer';

export const streamJsonToChatEntryTransformer = ({
  parsed,
}: {
  parsed: unknown;
}): StreamJsonResult => {
  const lineParse = normalizedStreamLineContract.safeParse(parsed);
  if (!lineParse.success) {
    return streamJsonResultContract.parse({ entries: [], sessionId: null });
  }
  const line = lineParse.data;
  const { type } = line;

  if (type === 'system' && line.subtype === 'init') {
    const { sessionId } = line;

    return streamJsonResultContract.parse({
      entries: [],
      sessionId: typeof sessionId === 'string' ? String(sessionId) : null,
    });
  }

  if (type === 'assistant') {
    const entries = parseAssistantStreamEntryTransformer({ parsed });

    return streamJsonResultContract.parse({ entries, sessionId: null });
  }

  if (type === 'user') {
    const entries = parseUserStreamEntryTransformer({ parsed });

    return streamJsonResultContract.parse({ entries, sessionId: null });
  }

  if (type === 'result') {
    const { sessionId } = line;

    return streamJsonResultContract.parse({
      entries: [],
      sessionId: typeof sessionId === 'string' ? String(sessionId) : null,
    });
  }

  return streamJsonResultContract.parse({ entries: [], sessionId: null });
};
