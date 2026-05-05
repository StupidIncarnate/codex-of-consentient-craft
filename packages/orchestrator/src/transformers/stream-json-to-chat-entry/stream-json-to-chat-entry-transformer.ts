/**
 * PURPOSE: Parses a single stream-json parsed object into chat entries and optional session ID
 *
 * USAGE:
 * streamJsonToChatEntryTransformer({parsed: {type: 'assistant', message: {content: [{type: 'text', text: 'hi'}]}}});
 * // Returns {entries: [{role: 'assistant', type: 'text', content: 'hi', uuid: '<uuid>:0', timestamp: '<iso>'}], sessionId: null}
 *
 * Each emitted ChatEntry carries `uuid` (`<line-uuid>:<content-item-index>`) and `timestamp`
 * (extracted from the parsed line, or 1970 epoch fallback). The web binding keys entries by
 * uuid for dedup and sorts by timestamp so streaming and replay paths produce identical DOM,
 * even when the dual-source convergence (parent stdout + sub-agent JSONL tail) emits the same
 * content twice.
 */
import { normalizedStreamLineContract } from '../../contracts/normalized-stream-line/normalized-stream-line-contract';
import { streamJsonResultContract } from '../../contracts/stream-json-result/stream-json-result-contract';
import type { StreamJsonResult } from '../../contracts/stream-json-result/stream-json-result-contract';
import { extractTimestampFromJsonlLineTransformer } from '../extract-timestamp-from-jsonl-line/extract-timestamp-from-jsonl-line-transformer';
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

  // Resolve uuid + timestamp once per line — every emitted entry from this line shares the
  // line uuid (combined with the content-item index for entry-level uniqueness) and the
  // line timestamp. Both the parent stdout and the sub-agent JSONL tail attach the SAME
  // `uuid` to the same logical line — so the web binding's uuid-keyed dedup map collapses
  // duplicate emissions into one entry.
  const rawUuid = line.uuid;
  const lineUuid =
    typeof rawUuid === 'string' && String(rawUuid).length > 0
      ? String(rawUuid)
      : crypto.randomUUID();
  const timestamp = String(extractTimestampFromJsonlLineTransformer({ parsed }));

  if (type === 'assistant') {
    const entries = parseAssistantStreamEntryTransformer({ parsed, lineUuid, timestamp });

    return streamJsonResultContract.parse({ entries, sessionId: null });
  }

  if (type === 'user') {
    const entries = parseUserStreamEntryTransformer({ parsed, lineUuid, timestamp });

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
