/**
 * PURPOSE: Groups consecutive tool entries into collapsible tool groups for the chat UI
 *
 * USAGE:
 * groupChatEntriesTransformer({entries: chatEntries});
 * // Returns ChatEntryGroup[] with single entries and tool groups
 */

import type { ChatEntry } from '../../contracts/chat-entry/chat-entry-contract';
import type { ChatEntryGroup } from '../../contracts/chat-entry-group/chat-entry-group-contract';
import { isToolEntryGuard } from '../../guards/is-tool-entry/is-tool-entry-guard';
import { flushToolGroupTransformer } from '../flush-tool-group/flush-tool-group-transformer';
import { resolveChatEntrySourceTransformer } from '../resolve-chat-entry-source/resolve-chat-entry-source-transformer';

export const groupChatEntriesTransformer = ({
  entries,
}: {
  entries: ChatEntry[];
}): ChatEntryGroup[] => {
  const groups: ChatEntryGroup[] = [];
  let currentToolGroup: ChatEntry[] = [];
  let currentGroupSource: 'session' | 'subagent' = 'session';
  let currentGroupFirstEntry: ChatEntry | null = null;

  for (const entry of entries) {
    if (isToolEntryGuard({ entry })) {
      const entrySource = resolveChatEntrySourceTransformer({ entry });

      if (
        currentToolGroup.length > 0 &&
        entrySource !== currentGroupSource &&
        currentGroupFirstEntry !== null
      ) {
        groups.push(
          flushToolGroupTransformer({
            group: currentToolGroup,
            firstEntry: currentGroupFirstEntry,
          }),
        );
        currentToolGroup = [];
        currentGroupFirstEntry = null;
      }

      if (currentToolGroup.length === 0) {
        currentGroupSource = entrySource;
        currentGroupFirstEntry = entry;
      }

      currentToolGroup.push(entry);
    } else {
      if (currentToolGroup.length > 0 && currentGroupFirstEntry !== null) {
        groups.push(
          flushToolGroupTransformer({
            group: currentToolGroup,
            firstEntry: currentGroupFirstEntry,
          }),
        );
        currentToolGroup = [];
        currentGroupFirstEntry = null;
      }

      groups.push({ kind: 'single' as const, entry } as ChatEntryGroup);
    }
  }

  if (currentToolGroup.length > 0 && currentGroupFirstEntry !== null) {
    groups.push(
      flushToolGroupTransformer({ group: currentToolGroup, firstEntry: currentGroupFirstEntry }),
    );
  }

  return groups;
};
