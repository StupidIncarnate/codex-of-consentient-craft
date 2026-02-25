/**
 * PURPOSE: Parses a user-type stream JSON object into chat entries, extracting only tool_result items
 *
 * USAGE:
 * parseUserStreamEntryTransformer({parsed: {type: 'user', message: {content: [{type: 'tool_result', tool_use_id: 'id', content: 'data'}]}}});
 * // Returns ChatEntry[] containing only tool_result entries from user messages
 */
import type { ChatEntry } from '../../contracts/chat-entry/chat-entry-contract';
import { mapContentItemToChatEntryTransformer } from '../map-content-item-to-chat-entry/map-content-item-to-chat-entry-transformer';

export const parseUserStreamEntryTransformer = ({ parsed }: { parsed: object }): ChatEntry[] => {
  const message: unknown = 'message' in parsed ? Reflect.get(parsed, 'message') : null;

  if (typeof message !== 'object' || message === null) {
    return [];
  }

  const contentArray: unknown = 'content' in message ? Reflect.get(message, 'content') : null;

  if (!Array.isArray(contentArray)) {
    return [];
  }

  const rawSource: unknown = 'source' in parsed ? Reflect.get(parsed, 'source') : undefined;
  const validSource = rawSource === 'session' || rawSource === 'subagent' ? rawSource : undefined;
  const rawAgentId: unknown = 'agentId' in parsed ? Reflect.get(parsed, 'agentId') : undefined;
  const validAgentId =
    typeof rawAgentId === 'string' && rawAgentId.length > 0 ? rawAgentId : undefined;

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
        ...(validSource ? { source: validSource } : {}),
        ...(validAgentId ? { agentId: validAgentId } : {}),
      });

      if (entry) {
        entries.push(entry);
      }
    }
  }

  return entries;
};
