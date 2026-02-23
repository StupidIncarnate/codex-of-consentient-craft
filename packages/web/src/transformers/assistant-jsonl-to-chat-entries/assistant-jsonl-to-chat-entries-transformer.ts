/**
 * PURPOSE: Transforms an assistant-type JSONL entry into ChatEntry array items
 *
 * USAGE:
 * assistantJsonlToChatEntriesTransformer({entry: {message: {content: [...]}}, validSource: undefined, validAgentId: undefined});
 * // Returns ChatEntry[] from assistant content items
 */
import type { ChatEntry } from '../../contracts/chat-entry/chat-entry-contract';
import { mapContentItemToChatEntryTransformer } from '../map-content-item-to-chat-entry/map-content-item-to-chat-entry-transformer';
import { mapUsageToChatUsageTransformer } from '../map-usage-to-chat-usage/map-usage-to-chat-usage-transformer';

export const assistantJsonlToChatEntriesTransformer = ({
  entry,
  validSource,
  validAgentId,
}: {
  entry: object;
  validSource: 'session' | 'subagent' | undefined;
  validAgentId: string | undefined;
}): ChatEntry[] => {
  const result: ChatEntry[] = [];
  const message: unknown = 'message' in entry ? Reflect.get(entry, 'message') : null;

  if (typeof message !== 'object' || message === null || !('content' in message)) {
    return result;
  }

  const contentArray: unknown = Reflect.get(message, 'content');
  const rawUsage: unknown = 'usage' in message ? Reflect.get(message, 'usage') : null;
  const usage =
    typeof rawUsage === 'object' && rawUsage !== null
      ? mapUsageToChatUsageTransformer({ usage: rawUsage as never })
      : undefined;

  const rawModel: unknown = 'model' in message ? Reflect.get(message, 'model') : undefined;
  const validModel = typeof rawModel === 'string' && rawModel.length > 0 ? rawModel : undefined;

  if (!Array.isArray(contentArray)) {
    return result;
  }

  for (const item of contentArray) {
    if (typeof item === 'object' && item !== null) {
      const chatEntry = mapContentItemToChatEntryTransformer({
        item: item as never,
        usage,
        ...(validModel ? { model: validModel } : {}),
        ...(validSource ? { source: validSource } : {}),
        ...(validAgentId ? { agentId: validAgentId } : {}),
      });

      if (chatEntry) {
        result.push(chatEntry);
      }
    }
  }

  return result;
};
