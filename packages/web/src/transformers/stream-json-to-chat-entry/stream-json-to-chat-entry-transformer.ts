/**
 * PURPOSE: Parses a single stream-json line into chat entries and optional session ID
 *
 * USAGE:
 * streamJsonToChatEntryTransformer({line: '{"type":"assistant","message":{"content":[{"type":"text","text":"hi"}]}}'});
 * // Returns {entries: [{role: 'assistant', type: 'text', content: 'hi'}], sessionId: null}
 */
import { streamJsonResultContract } from '../../contracts/stream-json-result/stream-json-result-contract';
import type { StreamJsonResult } from '../../contracts/stream-json-result/stream-json-result-contract';
import { parseAssistantStreamEntryTransformer } from '../parse-assistant-stream-entry/parse-assistant-stream-entry-transformer';
import { parseUserStreamEntryTransformer } from '../parse-user-stream-entry/parse-user-stream-entry-transformer';

export const streamJsonToChatEntryTransformer = ({ line }: { line: string }): StreamJsonResult => {
  const parsed: unknown = JSON.parse(line);

  if (typeof parsed !== 'object' || parsed === null || !('type' in parsed)) {
    return streamJsonResultContract.parse({ entries: [], sessionId: null });
  }

  const type: unknown = Reflect.get(parsed, 'type');

  if (type === 'system' && 'subtype' in parsed && Reflect.get(parsed, 'subtype') === 'init') {
    const sessionId: unknown = 'session_id' in parsed ? Reflect.get(parsed, 'session_id') : null;

    return streamJsonResultContract.parse({
      entries: [],
      sessionId: typeof sessionId === 'string' ? sessionId : null,
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
    const sessionId: unknown = 'session_id' in parsed ? Reflect.get(parsed, 'session_id') : null;

    return streamJsonResultContract.parse({
      entries: [],
      sessionId: typeof sessionId === 'string' ? sessionId : null,
    });
  }

  return streamJsonResultContract.parse({ entries: [], sessionId: null });
};
