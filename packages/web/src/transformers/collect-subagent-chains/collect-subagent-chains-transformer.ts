/**
 * PURPOSE: Collects sub-agent entries into collapsible chain groups, preserving ordering of non-chain entries
 *
 * USAGE:
 * collectSubagentChainsTransformer({entries: chatEntries});
 * // Returns ChatEntryGroup[] with subagent-chain groups and normal groups interleaved
 */

import type { ChatEntry } from '../../contracts/chat-entry/chat-entry-contract';
import type {
  ChatEntryGroup,
  SubagentChainGroup,
} from '../../contracts/chat-entry-group/chat-entry-group-contract';
import { isTaskToolUseGuard } from '../../guards/is-task-tool-use/is-task-tool-use-guard';
import { extractTaskDescriptionTransformer } from '../extract-task-description/extract-task-description-transformer';
import { flushNormalBufferTransformer } from '../flush-normal-buffer/flush-normal-buffer-transformer';
import { groupChatEntriesTransformer } from '../group-chat-entries/group-chat-entries-transformer';
import { indexSubagentEntriesTransformer } from '../index-subagent-entries/index-subagent-entries-transformer';

type ChainAgentId = SubagentChainGroup['agentId'];

export const collectSubagentChainsTransformer = ({
  entries,
}: {
  entries: ChatEntry[];
}): ChatEntryGroup[] => {
  const subagentMap = indexSubagentEntriesTransformer({ entries });
  const consumed = new Set<ChatEntry>();
  const groups: ChatEntryGroup[] = [];
  let normalBuffer: ChatEntry[] = [];

  for (const entry of entries) {
    if (consumed.has(entry)) {
      continue;
    }

    if (isTaskToolUseGuard({ entry })) {
      const agentId = String(('agentId' in entry && entry.agentId) || '') as ChainAgentId;
      const subagentEntries = subagentMap.get(agentId) ?? [];

      for (const subEntry of subagentEntries) {
        consumed.add(subEntry);
      }

      const taskNotification =
        entries.find(
          (e) =>
            !consumed.has(e) &&
            e.role === 'system' &&
            'type' in e &&
            e.type === 'task_notification' &&
            'taskId' in e &&
            String(e.taskId) === agentId,
        ) ?? null;

      if (taskNotification !== null) {
        consumed.add(taskNotification);
      }

      const toolResult =
        entries.find(
          (e) =>
            !consumed.has(e) &&
            e.role === 'assistant' &&
            'type' in e &&
            e.type === 'tool_result' &&
            'agentId' in e &&
            String(e.agentId) === agentId &&
            !('source' in e && e.source === 'subagent'),
        ) ?? null;

      if (toolResult !== null) {
        consumed.add(toolResult);
      }

      consumed.add(entry);

      const innerGroups = groupChatEntriesTransformer({ entries: subagentEntries });
      const description = extractTaskDescriptionTransformer({ entry });

      const flushed = flushNormalBufferTransformer({ buffer: normalBuffer });
      groups.push(...flushed);
      normalBuffer = [];

      groups.push({
        kind: 'subagent-chain',
        agentId,
        description,
        taskToolUse: entry,
        innerGroups,
        taskNotification,
        entryCount: subagentEntries.length,
      } as ChatEntryGroup);
    } else {
      normalBuffer.push(entry);
    }
  }

  const remaining = flushNormalBufferTransformer({ buffer: normalBuffer });
  groups.push(...remaining);

  return groups;
};
