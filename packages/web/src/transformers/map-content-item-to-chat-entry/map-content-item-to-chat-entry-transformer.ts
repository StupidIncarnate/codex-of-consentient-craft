/**
 * PURPOSE: Transforms a single API content item into a ChatEntry, attaching usage data for text items
 *
 * USAGE:
 * mapContentItemToChatEntryTransformer({item: {type: 'text', text: 'hello'}, usage: {inputTokens: 10, outputTokens: 5, cacheCreationInputTokens: 0, cacheReadInputTokens: 0}});
 * // Returns {role: 'assistant', type: 'text', content: 'hello', usage: {...}} or null if unrecognized
 */
import { chatEntryContract } from '../../contracts/chat-entry/chat-entry-contract';
import type { ChatEntry, ChatUsage } from '../../contracts/chat-entry/chat-entry-contract';

export const mapContentItemToChatEntryTransformer = ({
  item,
  usage,
}: {
  item: Record<string, unknown>;
  usage: ChatUsage | undefined;
}): ChatEntry | null => {
  const itemType = item.type;

  if (itemType === 'text') {
    const text = typeof item.text === 'string' ? item.text : '';

    return chatEntryContract.parse({
      role: 'assistant',
      type: 'text',
      content: text,
      ...(usage ? { usage } : {}),
    });
  }

  if (itemType === 'tool_use') {
    const name = typeof item.name === 'string' ? item.name : '';

    return chatEntryContract.parse({
      role: 'assistant',
      type: 'tool_use',
      toolName: name,
      toolInput: JSON.stringify(item.input ?? {}),
    });
  }

  if (itemType === 'tool_result') {
    const toolUseId = typeof item.tool_use_id === 'string' ? item.tool_use_id : '';
    const content = typeof item.content === 'string' ? item.content : '';

    return chatEntryContract.parse({
      role: 'assistant',
      type: 'tool_result',
      toolName: toolUseId,
      content,
    });
  }

  return null;
};
