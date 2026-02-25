/**
 * PURPOSE: Parses an assistant-type stream JSON object into chat entries with source/agentId resolution
 *
 * USAGE:
 * parseAssistantStreamEntryTransformer({parsed: {type: 'assistant', message: {content: [{type: 'text', text: 'hi'}]}}});
 * // Returns ChatEntry[] from assistant content items with resolved source and agentId
 */
import type { ChatEntry } from '../../contracts/chat-entry/chat-entry-contract';
import { mapContentItemToChatEntryTransformer } from '../map-content-item-to-chat-entry/map-content-item-to-chat-entry-transformer';
import { mapUsageToChatUsageTransformer } from '../map-usage-to-chat-usage/map-usage-to-chat-usage-transformer';

export const parseAssistantStreamEntryTransformer = ({
  parsed,
}: {
  parsed: object;
}): ChatEntry[] => {
  const message: unknown = 'message' in parsed ? Reflect.get(parsed, 'message') : null;

  if (typeof message !== 'object' || message === null) {
    return [];
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
    return [];
  }

  const entries: ChatEntry[] = [];

  for (const item of contentArray) {
    if (typeof item !== 'object' || item === null) {
      continue;
    }

    const itemSource: unknown = 'source' in item ? Reflect.get(item, 'source') : undefined;
    const itemAgentId: unknown = 'agentId' in item ? Reflect.get(item, 'agentId') : undefined;
    const resolvedSource =
      itemSource === 'session' || itemSource === 'subagent' ? itemSource : validSource;
    const resolvedAgentId =
      typeof itemAgentId === 'string' && itemAgentId.length > 0 ? itemAgentId : validAgentId;

    const entry = mapContentItemToChatEntryTransformer({
      item: item as never,
      usage,
      ...(validModel ? { model: validModel } : {}),
      ...(resolvedSource ? { source: resolvedSource } : {}),
      ...(resolvedAgentId ? { agentId: resolvedAgentId } : {}),
    });

    if (entry) {
      entries.push(entry);
    }
  }

  return entries;
};
