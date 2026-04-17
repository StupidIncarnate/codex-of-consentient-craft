/**
 * PURPOSE: Merges tool_use entries with their corresponding tool_result into paired items while preserving all other entry types
 *
 * USAGE:
 * mergeToolEntriesTransformer({entries: chatEntries});
 * // Returns MergedChatItem[] where tool_use+tool_result are paired and non-tool entries pass through
 */

import type { ChatEntry } from '@dungeonmaster/shared/contracts';
import type { MergedChatItem } from '../../contracts/merged-chat-item/merged-chat-item-contract';
import { mergedChatItemContract } from '../../contracts/merged-chat-item/merged-chat-item-contract';
import { toolNameContract } from '../../contracts/tool-name/tool-name-contract';
import type { ToolName } from '../../contracts/tool-name/tool-name-contract';

type ToolResultEntry = Extract<ChatEntry, { type: 'tool_result' }>;

export const mergeToolEntriesTransformer = ({
  entries,
}: {
  entries: ChatEntry[];
}): MergedChatItem[] => {
  const items: MergedChatItem[] = [];
  const resultByToolUseId = new Map<ToolName, ToolResultEntry>();
  const matchedToolNames = new Set<ToolName>();

  // Index all tool_result entries by their tool_use_id (stored in toolName field)
  for (const entry of entries) {
    if ('type' in entry && entry.type === 'tool_result') {
      resultByToolUseId.set(entry.toolName, entry);
    }
  }

  // Build set of matched result IDs by scanning tool_use entries
  for (const entry of entries) {
    if ('type' in entry && entry.type === 'tool_use') {
      const { toolUseId } = entry;
      const lookupKey = toolUseId === undefined ? null : toolNameContract.parse(toolUseId);
      const matchedResult = lookupKey === null ? null : (resultByToolUseId.get(lookupKey) ?? null);

      if (lookupKey !== null && matchedResult !== null) {
        matchedToolNames.add(lookupKey);
      }
    }
  }

  // Iterate entries in order, merging tool pairs and passing through everything else
  for (const entry of entries) {
    if ('type' in entry && entry.type === 'tool_use') {
      const { toolUseId } = entry;
      const lookupKey = toolUseId === undefined ? null : toolNameContract.parse(toolUseId);
      const matchedResult = lookupKey === null ? null : (resultByToolUseId.get(lookupKey) ?? null);

      items.push(
        mergedChatItemContract.parse({
          kind: 'tool-pair',
          toolUse: entry,
          toolResult: matchedResult,
        }),
      );
      continue;
    }

    // Skip tool_results that were already paired with a tool_use
    if ('type' in entry && entry.type === 'tool_result') {
      if (matchedToolNames.has(entry.toolName)) {
        continue;
      }
    }

    // Non-tool entries and orphan tool_results pass through
    items.push(mergedChatItemContract.parse({ kind: 'entry', entry }));
  }

  return items;
};
