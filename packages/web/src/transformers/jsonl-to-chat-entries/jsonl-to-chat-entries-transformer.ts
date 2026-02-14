/**
 * PURPOSE: Transforms an array of JSONL history objects into ChatEntry array
 *
 * USAGE:
 * jsonlToChatEntriesTransformer({entries: [{type: 'user', message: {role: 'user', content: 'hello'}}]});
 * // Returns [{role: 'user', content: 'hello'}]
 */
import { chatEntryContract } from '../../contracts/chat-entry/chat-entry-contract';
import type { ChatEntry } from '../../contracts/chat-entry/chat-entry-contract';
import { mapContentItemToChatEntryTransformer } from '../map-content-item-to-chat-entry/map-content-item-to-chat-entry-transformer';
import { mapUsageToChatUsageTransformer } from '../map-usage-to-chat-usage/map-usage-to-chat-usage-transformer';

export const jsonlToChatEntriesTransformer = ({ entries }: { entries: unknown[] }): ChatEntry[] => {
  const result: ChatEntry[] = [];

  for (const entry of entries) {
    if (typeof entry !== 'object' || entry === null || !('type' in entry)) {
      continue;
    }

    const entryType: unknown = Reflect.get(entry, 'type');

    if (entryType === 'user') {
      const message: unknown = 'message' in entry ? Reflect.get(entry, 'message') : null;

      if (typeof message !== 'object' || message === null || !('content' in message)) {
        continue;
      }

      const content: unknown = Reflect.get(message, 'content');

      if (typeof content === 'string') {
        if (content.length > 0) {
          result.push(chatEntryContract.parse({ role: 'user', content }));
        }

        continue;
      }

      if (Array.isArray(content)) {
        const textContent = content
          .filter(
            (item: unknown): boolean =>
              typeof item === 'object' &&
              item !== null &&
              'type' in item &&
              Reflect.get(item, 'type') === 'text',
          )
          .map((item: unknown) => {
            if (typeof item === 'object' && item !== null && 'text' in item) {
              const text: unknown = Reflect.get(item, 'text');

              return typeof text === 'string' ? text : '';
            }

            return '';
          })
          .join('');

        if (textContent.length > 0) {
          result.push(chatEntryContract.parse({ role: 'user', content: textContent }));
        }
      }

      continue;
    }

    if (entryType === 'assistant') {
      const message: unknown = 'message' in entry ? Reflect.get(entry, 'message') : null;

      if (typeof message !== 'object' || message === null || !('content' in message)) {
        continue;
      }

      const contentArray: unknown = Reflect.get(message, 'content');
      const rawUsage: unknown = 'usage' in message ? Reflect.get(message, 'usage') : null;
      const usage =
        typeof rawUsage === 'object' && rawUsage !== null
          ? mapUsageToChatUsageTransformer({ usage: rawUsage as never })
          : undefined;

      if (!Array.isArray(contentArray)) {
        continue;
      }

      for (const item of contentArray) {
        if (typeof item === 'object' && item !== null) {
          const chatEntry = mapContentItemToChatEntryTransformer({
            item: item as never,
            usage,
          });

          if (chatEntry) {
            result.push(chatEntry);
          }
        }
      }
    }
  }

  return result;
};
