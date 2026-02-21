/**
 * PURPOSE: Converts an array of consecutive tool chat entries into a ToolGroup structure
 *
 * USAGE:
 * flushToolGroupTransformer({group: [toolUseEntry, toolResultEntry]});
 * // Returns ChatEntryGroup with kind 'tool-group'
 */

import type { ChatEntry } from '../../contracts/chat-entry/chat-entry-contract';
import type { ChatEntryGroup } from '../../contracts/chat-entry-group/chat-entry-group-contract';
import { contextTokenCountContract } from '../../contracts/context-token-count/context-token-count-contract';
import { resolveChatEntrySourceTransformer } from '../resolve-chat-entry-source/resolve-chat-entry-source-transformer';

export const flushToolGroupTransformer = ({
  group,
  firstEntry,
}: {
  group: ChatEntry[];
  firstEntry: ChatEntry;
}): ChatEntryGroup => {
  const toolUseEntries = group.filter(
    (e) => e.role === 'assistant' && 'type' in e && e.type === 'tool_use',
  );

  const [firstToolUse] = toolUseEntries;
  const usage =
    firstToolUse !== undefined && 'usage' in firstToolUse && firstToolUse.usage !== undefined
      ? firstToolUse.usage
      : null;

  const contextTokens =
    usage === null
      ? null
      : contextTokenCountContract.parse(
          Number(usage.inputTokens) +
            Number(usage.cacheCreationInputTokens) +
            Number(usage.cacheReadInputTokens),
        );

  return {
    kind: 'tool-group' as const,
    entries: group,
    toolCount: toolUseEntries.length,
    contextTokens,
    source: resolveChatEntrySourceTransformer({ entry: firstEntry }),
  } as ChatEntryGroup;
};
