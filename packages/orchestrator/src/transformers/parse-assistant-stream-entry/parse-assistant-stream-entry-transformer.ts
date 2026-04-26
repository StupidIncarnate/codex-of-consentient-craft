/**
 * PURPOSE: Parses an assistant-type stream JSON object into chat entries with source/agentId resolution
 *
 * USAGE:
 * parseAssistantStreamEntryTransformer({parsed: {type: 'assistant', message: {content: [{type: 'text', text: 'hi'}]}}});
 * // Returns ChatEntry[] from assistant content items with resolved source and agentId
 */
import type { ChatEntry } from '@dungeonmaster/shared/contracts';
import { normalizedStreamLineContentItemContract } from '../../contracts/normalized-stream-line-content-item/normalized-stream-line-content-item-contract';
import { normalizedStreamLineContract } from '../../contracts/normalized-stream-line/normalized-stream-line-contract';
import { mapContentItemToChatEntryTransformer } from '../map-content-item-to-chat-entry/map-content-item-to-chat-entry-transformer';
import { mapUsageToChatUsageTransformer } from '../map-usage-to-chat-usage/map-usage-to-chat-usage-transformer';

export const parseAssistantStreamEntryTransformer = ({
  parsed,
}: {
  parsed: unknown;
}): ChatEntry[] => {
  const lineParse = normalizedStreamLineContract.safeParse(parsed);
  if (!lineParse.success) {
    return [];
  }
  const line = lineParse.data;

  const { message } = line;
  if (message === undefined) {
    return [];
  }

  const contentArray = message.content;
  const rawUsage = message.usage;
  const usage =
    typeof rawUsage === 'object' && rawUsage !== null
      ? mapUsageToChatUsageTransformer({ usage: rawUsage as never })
      : undefined;

  const rawSource = line.source === undefined ? undefined : String(line.source);
  const validSource: 'session' | 'subagent' | undefined =
    rawSource === 'session' || rawSource === 'subagent' ? rawSource : undefined;
  const rawAgentId = line.agentId;
  const validAgentId =
    typeof rawAgentId === 'string' && String(rawAgentId).length > 0
      ? String(rawAgentId)
      : undefined;

  const rawModel = message.model;
  const validModel =
    typeof rawModel === 'string' && String(rawModel).length > 0 ? String(rawModel) : undefined;

  if (!Array.isArray(contentArray)) {
    return [];
  }

  const entries: ChatEntry[] = [];

  for (const rawItem of contentArray) {
    const itemParse = normalizedStreamLineContentItemContract.safeParse(rawItem);
    if (!itemParse.success) continue;
    const item = itemParse.data;

    const itemSource = item.source === undefined ? undefined : String(item.source);
    const itemAgentId = item.agentId;
    const resolvedSource: 'session' | 'subagent' | undefined =
      itemSource === 'session' || itemSource === 'subagent' ? itemSource : validSource;
    const resolvedAgentId =
      typeof itemAgentId === 'string' && String(itemAgentId).length > 0
        ? String(itemAgentId)
        : validAgentId;

    const entry = mapContentItemToChatEntryTransformer({
      item: rawItem as never,
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
