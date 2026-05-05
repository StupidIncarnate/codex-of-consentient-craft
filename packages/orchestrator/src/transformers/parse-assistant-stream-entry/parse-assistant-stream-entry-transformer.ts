/**
 * PURPOSE: Parses an assistant-type stream JSON object into chat entries with source/agentId resolution
 *
 * USAGE:
 * parseAssistantStreamEntryTransformer({parsed: {type: 'assistant', message: {content: [{type: 'text', text: 'hi'}]}}});
 * // Returns ChatEntry[] from assistant content items with resolved source and agentId.
 * // Every entry carries uuid (`<line-uuid>:<item-index>`) and timestamp from the source line so
 * // the web binding can dedup duplicate emissions and timestamp-sort streamed/replayed entries
 * // identically.
 */
import type { ChatEntry } from '@dungeonmaster/shared/contracts';
import { normalizedStreamLineContentItemContract } from '../../contracts/normalized-stream-line-content-item/normalized-stream-line-content-item-contract';
import { normalizedStreamLineContract } from '../../contracts/normalized-stream-line/normalized-stream-line-contract';
import { extractTimestampFromJsonlLineTransformer } from '../extract-timestamp-from-jsonl-line/extract-timestamp-from-jsonl-line-transformer';
import { mapContentItemToChatEntryTransformer } from '../map-content-item-to-chat-entry/map-content-item-to-chat-entry-transformer';
import { mapUsageToChatUsageTransformer } from '../map-usage-to-chat-usage/map-usage-to-chat-usage-transformer';

export const parseAssistantStreamEntryTransformer = ({
  parsed,
  lineUuid,
  timestamp,
}: {
  parsed: unknown;
  lineUuid?: string;
  timestamp?: string;
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

  const rawLineUuid = line.uuid;
  const resolvedLineUuid =
    typeof lineUuid === 'string' && lineUuid.length > 0
      ? lineUuid
      : typeof rawLineUuid === 'string' && String(rawLineUuid).length > 0
        ? String(rawLineUuid)
        : crypto.randomUUID();
  const resolvedTimestamp =
    typeof timestamp === 'string' && timestamp.length > 0
      ? timestamp
      : String(extractTimestampFromJsonlLineTransformer({ parsed }));

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

  for (let index = 0; index < contentArray.length; index += 1) {
    const rawItem: unknown = contentArray[index];
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
      uuid: `${resolvedLineUuid}:${String(index)}`,
      timestamp: resolvedTimestamp,
    });

    if (entry) {
      entries.push(entry);
    }
  }

  return entries;
};
