/**
 * PURPOSE: Transforms a user-type JSONL entry into ChatEntry array items
 *
 * USAGE:
 * userJsonlToChatEntriesTransformer({entry: {message: {content: 'hello'}}, validSource: 'session', validAgentId: undefined});
 * // Returns [{role: 'user', content: 'hello'}]
 */
import { chatEntryContract } from '../../contracts/chat-entry/chat-entry-contract';
import type { ChatEntry } from '../../contracts/chat-entry/chat-entry-contract';
import { mapContentItemToChatEntryTransformer } from '../map-content-item-to-chat-entry/map-content-item-to-chat-entry-transformer';
import { parseTaskNotificationTransformer } from '../parse-task-notification/parse-task-notification-transformer';

export const userJsonlToChatEntriesTransformer = ({
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

  const content: unknown = Reflect.get(message, 'content');

  if (typeof content === 'string') {
    if (content.trimStart().startsWith('<task-notification>')) {
      const taskEntry = parseTaskNotificationTransformer({ content });

      if (taskEntry) {
        return [taskEntry];
      }
    }

    if (content.length > 0) {
      const isInjectedPrompt = content.includes('## User Request');

      result.push(
        chatEntryContract.parse({
          role: 'user',
          content,
          ...(isInjectedPrompt ? { isInjectedPrompt: true } : {}),
          ...(validSource ? { source: validSource } : {}),
          ...(validAgentId ? { agentId: validAgentId } : {}),
        }),
      );
    }

    return result;
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
      result.push(
        chatEntryContract.parse({
          role: 'user',
          content: textContent,
          ...(validSource ? { source: validSource } : {}),
          ...(validAgentId ? { agentId: validAgentId } : {}),
        }),
      );
    }

    for (const item of content) {
      if (
        typeof item === 'object' &&
        item !== null &&
        'type' in item &&
        Reflect.get(item, 'type') === 'tool_result'
      ) {
        const chatEntry = mapContentItemToChatEntryTransformer({
          item: item as never,
          usage: undefined,
          ...(validSource ? { source: validSource } : {}),
          ...(validAgentId ? { agentId: validAgentId } : {}),
        });

        if (chatEntry) {
          result.push(chatEntry);
        }
      }
    }
  }

  return result;
};
