/**
 * PURPOSE: Transforms a single API content item into a ChatEntry, attaching usage data for text items
 *
 * USAGE:
 * mapContentItemToChatEntryTransformer({item: {type: 'text', text: 'hello'}, usage: {inputTokens: 10, outputTokens: 5, cacheCreationInputTokens: 0, cacheReadInputTokens: 0}});
 * // Returns {role: 'assistant', type: 'text', content: 'hello', usage: {...}} or null if unrecognized
 */
import { chatEntryContract } from '../../contracts/chat-entry/chat-entry-contract';
import type { ChatEntry, ChatUsage } from '../../contracts/chat-entry/chat-entry-contract';
import { normalizeAskUserQuestionInputTransformer } from '../normalize-ask-user-question-input/normalize-ask-user-question-input-transformer';

export const mapContentItemToChatEntryTransformer = ({
  item,
  usage,
  source,
  agentId,
}: {
  item: Record<string, unknown>;
  usage: ChatUsage | undefined;
  source?: 'session' | 'subagent';
  agentId?: string;
}): ChatEntry | null => {
  const itemType = item.type;

  if (itemType === 'text') {
    const text = typeof item.text === 'string' ? item.text : '';

    return chatEntryContract.parse({
      role: 'assistant',
      type: 'text',
      content: text,
      ...(usage ? { usage } : {}),
      ...(source ? { source } : {}),
      ...(agentId ? { agentId } : {}),
    });
  }

  if (itemType === 'tool_use') {
    const name = typeof item.name === 'string' ? item.name : '';
    const normalizedInput = normalizeAskUserQuestionInputTransformer({ name, input: item.input });

    return chatEntryContract.parse({
      role: 'assistant',
      type: 'tool_use',
      toolName: name,
      toolInput: JSON.stringify(normalizedInput),
      ...(usage ? { usage } : {}),
      ...(source ? { source } : {}),
      ...(agentId ? { agentId } : {}),
    });
  }

  if (itemType === 'tool_result') {
    const toolUseId = typeof item.tool_use_id === 'string' ? item.tool_use_id : '';
    const content = typeof item.content === 'string' ? item.content : '';
    const isError = item.is_error === true;

    return chatEntryContract.parse({
      role: 'assistant',
      type: 'tool_result',
      toolName: toolUseId,
      content,
      ...(isError ? { isError } : {}),
      ...(source ? { source } : {}),
      ...(agentId ? { agentId } : {}),
    });
  }

  return null;
};
