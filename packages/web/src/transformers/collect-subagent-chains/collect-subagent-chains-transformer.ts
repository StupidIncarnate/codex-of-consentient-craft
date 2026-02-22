/**
 * PURPOSE: Collects sub-agent entries into collapsible chain groups, preserving ordering of non-chain entries
 *
 * USAGE:
 * collectSubagentChainsTransformer({entries: chatEntries});
 * // Returns ChatEntryGroup[] with subagent-chain groups and normal groups interleaved
 */

import { arrayIndexContract, type ArrayIndex } from '@dungeonmaster/shared/contracts';
import type { ChatEntry } from '../../contracts/chat-entry/chat-entry-contract';
import type {
  ChatEntryGroup,
  SubagentChainGroup,
} from '../../contracts/chat-entry-group/chat-entry-group-contract';
import { contextTokenCountContract } from '../../contracts/context-token-count/context-token-count-contract';
import type { ContextTokenCount } from '../../contracts/context-token-count/context-token-count-contract';
import { isTaskToolUseGuard } from '../../guards/is-task-tool-use/is-task-tool-use-guard';
import { computeEntryContextTransformer } from '../compute-entry-context/compute-entry-context-transformer';
import { extractTaskDescriptionTransformer } from '../extract-task-description/extract-task-description-transformer';
import { flushNormalBufferTransformer } from '../flush-normal-buffer/flush-normal-buffer-transformer';
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

      const innerGroups = subagentEntries.map(
        (e) => ({ kind: 'single' as const, entry: e }) as ChatEntryGroup,
      );
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
        contextTokens: null,
      } as ChatEntryGroup);
    } else {
      normalBuffer.push(entry);
    }
  }

  const remaining = flushNormalBufferTransformer({ buffer: normalBuffer });
  groups.push(...remaining);

  const entryIndexMap = new Map<ChatEntry, ArrayIndex>();
  entries.forEach((e, i) => {
    entryIndexMap.set(e, arrayIndexContract.parse(i));
  });

  for (let gi = 0; gi < groups.length; gi++) {
    const group = groups[gi];

    if (group === undefined) {
      continue;
    }

    if (group.kind === 'tool-group' && group.contextTokens !== null) {
      const firstContext = group.contextTokens;
      const lastEntry = group.entries.at(-1);

      if (lastEntry === undefined) {
        continue;
      }

      const lastIndex = entryIndexMap.get(lastEntry) ?? -1;
      let nextContext: ContextTokenCount | null = null;

      for (let i = lastIndex + 1; i < entries.length; i++) {
        const candidate = entries[i];

        if (candidate === undefined) {
          continue;
        }

        nextContext = computeEntryContextTransformer({ entry: candidate });

        if (nextContext !== null) {
          break;
        }
      }

      if (nextContext === null) {
        groups[gi] = { ...group, contextTokens: null } as ChatEntryGroup;
      } else {
        const delta = Number(nextContext) - Number(firstContext);

        groups[gi] = {
          ...group,
          contextTokens: contextTokenCountContract.parse(Math.max(0, delta)),
        } as ChatEntryGroup;
      }
    }

    if (group.kind === 'subagent-chain') {
      const innerEntries = group.innerGroups
        .filter((g): g is Extract<ChatEntryGroup, { kind: 'single' }> => g.kind === 'single')
        .map((g) => g.entry);

      let firstContext: ContextTokenCount | null = null;
      let lastContext: ContextTokenCount | null = null;

      for (const innerEntry of innerEntries) {
        const ctx = computeEntryContextTransformer({ entry: innerEntry });

        if (ctx !== null) {
          if (firstContext === null) {
            firstContext = ctx;
          }

          lastContext = ctx;
        }
      }

      if (firstContext !== null && lastContext !== null) {
        const delta = Number(lastContext) - Number(firstContext);

        groups[gi] = {
          ...group,
          contextTokens: contextTokenCountContract.parse(Math.max(0, delta)),
        } as ChatEntryGroup;
      }
    }
  }

  return groups;
};
