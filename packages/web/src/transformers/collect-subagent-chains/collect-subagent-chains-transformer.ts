/**
 * PURPOSE: Collects sub-agent entries into collapsible chain groups, preserving ordering of non-chain entries as singles
 *
 * USAGE:
 * collectSubagentChainsTransformer({entries: chatEntries});
 * // Returns ChatEntryGroup[] with subagent-chain groups and single entry groups interleaved
 */

import type { ChatEntry } from '@dungeonmaster/shared/contracts';
import type {
  ChatEntryGroup,
  SingleGroup,
  SubagentChainGroup,
} from '../../contracts/chat-entry-group/chat-entry-group-contract';
import { contextTokenCountContract } from '../../contracts/context-token-count/context-token-count-contract';
import type { ContextTokenCount } from '../../contracts/context-token-count/context-token-count-contract';
import { isTaskToolUseGuard } from '../../guards/is-task-tool-use/is-task-tool-use-guard';
import { computeEntryContextTransformer } from '../compute-entry-context/compute-entry-context-transformer';
import { extractTaskDescriptionTransformer } from '../extract-task-description/extract-task-description-transformer';
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
  const chainsByAgentId = new Map<ChainAgentId, SubagentChainGroup>();
  let normalBuffer: ChatEntry[] = [];

  for (const entry of entries) {
    if (consumed.has(entry)) {
      continue;
    }

    if (isTaskToolUseGuard({ entry })) {
      const agentId = (
        'agentId' in entry && entry.agentId !== undefined ? String(entry.agentId) : ''
      ) as ChainAgentId;
      const fullBucket = subagentMap.get(agentId) ?? [];
      const subagentEntries = fullBucket.filter((e) => e !== entry);

      for (const subEntry of fullBucket) {
        consumed.add(subEntry);
      }

      // Match the task_notification by either:
      //   (a) its `taskId` matching the Task's wire-level agentId — legacy path where the Task
      //       entry's agentId was the real internal agentId (same as the notification's
      //       `<task-id>` XML tag); or
      //   (b) its `agentId` matching the Task's wire-level agentId — after the two-source
      //       convergence, the Task entry carries `agentId = toolUseId`, and the orchestrator
      //       stamps the notification's `agentId` from its `<tool-use-id>` XML tag (same
      //       toolUseId). This fallback pins the notification to the chain under the converged
      //       wire key.
      const taskNotification =
        entries.find(
          (e) =>
            !consumed.has(e) &&
            e.role === 'system' &&
            'type' in e &&
            e.type === 'task_notification' &&
            (('taskId' in e && String(e.taskId) === agentId) ||
              ('agentId' in e && e.agentId !== undefined && String(e.agentId) === agentId)),
        ) ?? null;

      if (taskNotification !== null) {
        consumed.add(taskNotification);
      }

      // Match the Task's completion tool_result by either:
      //   (a) its `agentId` matching the Task's wire-level agentId (toolUseId), for entries
      //       whose source carried `parent_tool_use_id` (streaming); or
      //   (b) its `toolName` matching the Task's toolUseId — user tool_result content items
      //       store the tool_use_id in `toolName`, and for Task completions the tool_result
      //       line itself has `parent_tool_use_id: null` so it never gets stamped. This
      //       fallback pins it to the chain anyway.
      const toolResult =
        entries.find(
          (e) =>
            !consumed.has(e) &&
            e.role === 'assistant' &&
            'type' in e &&
            e.type === 'tool_result' &&
            !('source' in e && e.source === 'subagent') &&
            (('agentId' in e && String(e.agentId) === agentId) ||
              ('toolName' in e && String(e.toolName) === agentId)),
        ) ?? null;

      if (toolResult !== null) {
        consumed.add(toolResult);
      }

      consumed.add(entry);

      const description = extractTaskDescriptionTransformer({ entry });

      const innerGroups: ChatEntryGroup[] = subagentEntries.map(
        (e) => ({ kind: 'single' as const, entry: e }) satisfies SingleGroup,
      );

      // Compute contextTokens delta from the SingleGroup entries at creation time so
      // nested chains pushed into innerGroups later do not affect the calculation.
      let firstContext: ContextTokenCount | null = null;
      let lastContext: ContextTokenCount | null = null;

      for (const subEntry of subagentEntries) {
        const ctx = computeEntryContextTransformer({ entry: subEntry });

        if (ctx !== null) {
          if (firstContext === null) {
            firstContext = ctx;
          }

          lastContext = ctx;
        }
      }

      const contextTokens =
        firstContext !== null && lastContext !== null
          ? contextTokenCountContract.parse(Math.max(0, Number(lastContext) - Number(firstContext)))
          : null;

      const chain = {
        kind: 'subagent-chain' as const,
        agentId,
        description,
        taskToolUse: entry,
        innerGroups,
        taskNotification,
        entryCount: subagentEntries.length,
        contextTokens,
      } as SubagentChainGroup;

      chainsByAgentId.set(agentId, chain);

      const parentKey =
        'parentAgentId' in entry && entry.parentAgentId !== undefined
          ? String(entry.parentAgentId)
          : '';

      const parentChain =
        parentKey === '' ? undefined : chainsByAgentId.get(parentKey as ChainAgentId);

      if (parentChain === undefined) {
        const flushedSingles: SingleGroup[] = normalBuffer.map(
          (e) => ({ kind: 'single' as const, entry: e }) satisfies SingleGroup,
        );
        groups.push(...flushedSingles);
        normalBuffer = [];
        groups.push(chain as ChatEntryGroup);
      } else {
        parentChain.innerGroups.push(chain);
      }
    } else {
      normalBuffer.push(entry);
    }
  }

  const trailingSingles: SingleGroup[] = normalBuffer.map(
    (e) => ({ kind: 'single' as const, entry: e }) satisfies SingleGroup,
  );
  groups.push(...trailingSingles);

  return groups;
};
