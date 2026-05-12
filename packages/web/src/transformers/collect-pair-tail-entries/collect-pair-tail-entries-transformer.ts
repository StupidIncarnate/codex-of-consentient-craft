/**
 * PURPOSE: Builds the set of tool_result entries that have already been paired with a tool_use, so the chat-list render loop knows to skip them as standalone singles
 *
 * USAGE:
 * collectPairTailEntriesTransformer({ entries: singleEntries });
 * // Returns Set<ChatEntry> of tool_result entries that should not render twice — used by ChatEntryListWidget to skip duplicate rendering after merge-tool-entries pairs them.
 */

import type { ChatEntry } from '@dungeonmaster/shared/contracts';
import { toolNameContract } from '../../contracts/tool-name/tool-name-contract';
import type { ToolName } from '../../contracts/tool-name/tool-name-contract';

export const collectPairTailEntriesTransformer = ({
  entries,
}: {
  entries: ChatEntry[];
}): Set<ChatEntry> => {
  const pairTails = new Set<ChatEntry>();
  const resultByUseId = new Map<ToolName, ChatEntry>();

  for (const entry of entries) {
    if ('type' in entry && entry.type === 'tool_result') {
      resultByUseId.set(entry.toolName, entry);
    }
  }

  for (const entry of entries) {
    if ('type' in entry && entry.type === 'tool_use' && entry.toolUseId !== undefined) {
      const lookupKey = toolNameContract.parse(entry.toolUseId);
      const result = resultByUseId.get(lookupKey);
      if (result !== undefined) {
        pairTails.add(result);
      }
    }
  }

  return pairTails;
};
