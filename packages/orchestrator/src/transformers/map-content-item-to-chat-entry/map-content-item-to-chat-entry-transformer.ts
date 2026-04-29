/**
 * PURPOSE: Transforms a single API content item into a ChatEntry, attaching usage data for text items
 *
 * USAGE:
 * mapContentItemToChatEntryTransformer({item: {type: 'text', text: 'hello'}, usage: {inputTokens: 10, outputTokens: 5, cacheCreationInputTokens: 0, cacheReadInputTokens: 0}});
 * // Returns {role: 'assistant', type: 'text', content: 'hello', usage: {...}} or null if unrecognized
 */
import { chatEntryContract } from '@dungeonmaster/shared/contracts';
import type { ChatEntry, ChatUsage } from '@dungeonmaster/shared/contracts';

import { normalizedStreamLineContentItemContract } from '../../contracts/normalized-stream-line-content-item/normalized-stream-line-content-item-contract';
import { normalizeAskUserQuestionInputTransformer } from '../normalize-ask-user-question-input/normalize-ask-user-question-input-transformer';

export const mapContentItemToChatEntryTransformer = ({
  item,
  usage,
  source,
  agentId,
  model,
}: {
  item: Record<string, unknown>;
  usage: ChatUsage | undefined;
  source?: 'session' | 'subagent';
  agentId?: string;
  model?: string;
}): ChatEntry | null => {
  const itemType = item.type;

  if (itemType === 'text') {
    const text = typeof item.text === 'string' ? item.text.trimStart() : '';

    return chatEntryContract.parse({
      role: 'assistant',
      type: 'text',
      content: text,
      ...(model ? { model } : {}),
      ...(usage ? { usage } : {}),
      ...(source ? { source } : {}),
      ...(agentId ? { agentId } : {}),
    });
  }

  if (itemType === 'tool_use') {
    const name = typeof item.name === 'string' ? item.name : '';
    const id = typeof item.id === 'string' ? item.id : undefined;
    const normalizedInput = normalizeAskUserQuestionInputTransformer({ name, input: item.input });

    return chatEntryContract.parse({
      role: 'assistant',
      type: 'tool_use',
      ...(id ? { toolUseId: id } : {}),
      toolName: name,
      toolInput: JSON.stringify(normalizedInput),
      ...(model ? { model } : {}),
      ...(usage ? { usage } : {}),
      ...(source ? { source } : {}),
      ...(agentId ? { agentId } : {}),
    });
  }

  if (itemType === 'tool_result') {
    const toolUseId = typeof item.toolUseId === 'string' ? item.toolUseId : '';
    // The Anthropic SDK admits string OR array<text|image|search_result|document|tool_reference>
    // for tool_result.content. Each array variant gets a string projection so the rendered
    // chat row body shows something meaningful regardless of which block type Claude returned:
    // - text → the text itself
    // - tool_reference → the tool_name (real CLI emits this for ToolSearch results)
    // - search_result → the title
    // - image / document → typed placeholder so the row body isn't silently empty
    const content =
      typeof item.content === 'string'
        ? item.content
        : Array.isArray(item.content)
          ? item.content
              .map((c: unknown) => {
                const cParse = normalizedStreamLineContentItemContract.safeParse(c);
                if (!cParse.success) return undefined;
                const block = cParse.data;
                if (block.type === 'text' && typeof block.text === 'string') return block.text;
                if (block.type === 'tool_reference' && typeof block.toolName === 'string')
                  return block.toolName;
                if (block.type === 'search_result' && typeof block.title === 'string')
                  return block.title;
                if (block.type === 'image') return '[image]';
                if (block.type === 'document') return '[document]';
                return undefined;
              })
              .filter((t: unknown) => typeof t === 'string')
              .join('\n')
          : '';
    const isError = item.isError === true;

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

  if (itemType === 'thinking') {
    const text = typeof item.thinking === 'string' ? item.thinking : '';

    return chatEntryContract.parse({
      role: 'assistant',
      type: 'thinking',
      content: text,
      ...(source ? { source } : {}),
      ...(agentId ? { agentId } : {}),
    });
  }

  return null;
};
