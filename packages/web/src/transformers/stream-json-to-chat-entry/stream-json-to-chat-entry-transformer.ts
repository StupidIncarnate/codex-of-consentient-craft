/**
 * PURPOSE: Parses a single stream-json line into chat entries and optional session ID
 *
 * USAGE:
 * streamJsonToChatEntryTransformer({line: '{"type":"assistant","message":{"content":[{"type":"text","text":"hi"}]}}'});
 * // Returns {entries: [{role: 'assistant', type: 'text', content: 'hi'}], sessionId: null}
 */
import type { ChatEntry } from '../../contracts/chat-entry/chat-entry-contract';
import { streamJsonResultContract } from '../../contracts/stream-json-result/stream-json-result-contract';
import type { StreamJsonResult } from '../../contracts/stream-json-result/stream-json-result-contract';
import { mapContentItemToChatEntryTransformer } from '../map-content-item-to-chat-entry/map-content-item-to-chat-entry-transformer';
import { mapUsageToChatUsageTransformer } from '../map-usage-to-chat-usage/map-usage-to-chat-usage-transformer';

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
    const message: unknown = 'message' in parsed ? Reflect.get(parsed, 'message') : null;

    if (typeof message !== 'object' || message === null) {
      return streamJsonResultContract.parse({ entries: [], sessionId: null });
    }

    const contentArray: unknown = 'content' in message ? Reflect.get(message, 'content') : null;
    const rawUsage: unknown = 'usage' in message ? Reflect.get(message, 'usage') : null;
    const usage =
      typeof rawUsage === 'object' && rawUsage !== null
        ? mapUsageToChatUsageTransformer({ usage: rawUsage as never })
        : undefined;

    const rawSource: unknown = 'source' in parsed ? Reflect.get(parsed, 'source') : undefined;
    const validSource = rawSource === 'session' || rawSource === 'subagent' ? rawSource : undefined;
    const rawAgentId: unknown = 'agentId' in parsed ? Reflect.get(parsed, 'agentId') : undefined;
    const validAgentId =
      typeof rawAgentId === 'string' && rawAgentId.length > 0 ? rawAgentId : undefined;

    const rawModel: unknown = 'model' in message ? Reflect.get(message, 'model') : undefined;
    const validModel = typeof rawModel === 'string' && rawModel.length > 0 ? rawModel : undefined;

    if (!Array.isArray(contentArray)) {
      return streamJsonResultContract.parse({ entries: [], sessionId: null });
    }

    const entries: ChatEntry[] = [];

    for (const item of contentArray) {
      if (typeof item === 'object' && item !== null) {
        const entry = mapContentItemToChatEntryTransformer({
          item: item as never,
          usage,
          ...(validModel ? { model: validModel } : {}),
          ...(validSource ? { source: validSource } : {}),
          ...(validAgentId ? { agentId: validAgentId } : {}),
        });

        if (entry) {
          entries.push(entry);
        }
      }
    }

    return streamJsonResultContract.parse({ entries, sessionId: null });
  }

  if (type === 'user') {
    const message: unknown = 'message' in parsed ? Reflect.get(parsed, 'message') : null;

    if (typeof message !== 'object' || message === null) {
      return streamJsonResultContract.parse({ entries: [], sessionId: null });
    }

    const contentArray: unknown = 'content' in message ? Reflect.get(message, 'content') : null;

    if (!Array.isArray(contentArray)) {
      return streamJsonResultContract.parse({ entries: [], sessionId: null });
    }

    const entries: ChatEntry[] = [];

    for (const item of contentArray) {
      if (
        typeof item === 'object' &&
        item !== null &&
        'type' in item &&
        Reflect.get(item, 'type') === 'tool_result'
      ) {
        const entry = mapContentItemToChatEntryTransformer({
          item: item as never,
          usage: undefined,
        });

        if (entry) {
          entries.push(entry);
        }
      }
    }

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
