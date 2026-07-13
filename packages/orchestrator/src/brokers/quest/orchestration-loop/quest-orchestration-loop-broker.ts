/**
 * PURPOSE: Drives quest execution by processing work item queue — find ready items, dispatch to role-specific layer brokers
 *
 * USAGE:
 * await questOrchestrationLoopBroker({processId, questId, startPath});
 * // Loops until all items complete, quest blocked, or waiting for user
 */

import type {
  AdapterResult,
  FilePath,
  GuildId,
  ProcessId,
  QuestId,
  UserInput,
  WorkItem,
  WorkItemRole,
} from '@dungeonmaster/shared/contracts';
import { adapterResultContract } from '@dungeonmaster/shared/contracts';

import type { ModifyQuestInput } from '@dungeonmaster/shared/contracts';
import type { OnAgentEntryCallback } from '../../../contracts/orchestration-callbacks/orchestration-callbacks-contract';
import type { SlotCount } from '../../../contracts/slot-count/slot-count-contract';
import { slotCountContract } from '../../../contracts/slot-count/slot-count-contract';
import { getQuestInputContract } from '@dungeonmaster/shared/contracts';
import {
  isActiveWorkItemStatusGuard,
  isUserPausedQuestStatusGuard,
} from '@dungeonmaster/shared/guards';
import { dungeonmasterConfigResolveAdapter } from '../../../adapters/dungeonmaster-config/resolve/dungeonmaster-config-resolve-adapter';
import { nextReadyWorkItemsTransformer } from '../../../transformers/next-ready-work-items/next-ready-work-items-transformer';
import { orchestrationLoopSummaryTransformer } from '../../../transformers/orchestration-loop-summary/orchestration-loop-summary-transformer';
import { workItemsToQuestStatusTransformer } from '../../../transformers/work-items-to-quest-status/work-items-to-quest-status-transformer';
import { questGetBroker } from '../get/quest-get-broker';
import { questModifyBroker } from '../modify/quest-modify-broker';
import { runChatLayerBroker } from './run-chat-layer-broker';

// NOTE: every execution-role layer broker (codeweaver, ward, siegemaster, lawbringer,
// blightwarden, spiritmender) is intentionally NOT imported here. Those roles are
// dispatched by the dispatch loop via get-next-step. The orchestration loop only
// retains the chat-role dispatch (chaoswhisperer / glyphsmith) for chat surfaces;
// every other role drops through this loop as a no-op.

const DEFAULT_SLOT_COUNT = 3;

const CHAT_ROLES = new Set<WorkItemRole>([
  'chaoswhisperer' as WorkItemRole,
  'glyphsmith' as WorkItemRole,
]);

export const questOrchestrationLoopBroker = async ({
  processId,
  questId,
  startPath,
  guildId,
  onAgentEntry,
  abortSignal,
  userMessage,
  slotCount: providedSlotCount,
}: {
  processId: ProcessId;
  questId: QuestId;
  startPath: FilePath;
  guildId: GuildId;
  onAgentEntry: OnAgentEntryCallback;
  abortSignal: AbortSignal;
  userMessage?: UserInput;
  slotCount?: SlotCount;
}): Promise<AdapterResult> => {
  const result = adapterResultContract.parse({ success: true });
  if (abortSignal.aborted) {
    return result;
  }

  // Resolve slotCount from project config ONCE per quest run, then propagate through the
  // recursive loop. A missing `.dungeonmaster` file (end-user installs, temp environments) is
  // not an error — fall back to the curated default the contract would have produced.
  const slotCount =
    providedSlotCount ??
    (await (async (): Promise<SlotCount> => {
      const fallbackSlotCount = slotCountContract.parse(DEFAULT_SLOT_COUNT);
      try {
        const config = await dungeonmasterConfigResolveAdapter({ startPath });
        return config.orchestration?.slotCount ?? fallbackSlotCount;
      } catch {
        return fallbackSlotCount;
      }
    })());

  // 1. Load quest
  const input = getQuestInputContract.parse({ questId });
  const questResult = await questGetBroker({ input });

  if (!questResult.success || !questResult.quest) {
    throw new Error(`Quest not found: ${questId}`);
  }

  const { quest } = questResult;

  // Paused quests must not spawn agents. User explicitly stopped execution;
  // resume happens via a status flip to 'in_progress' (auto-resume in quest-modify-responder).
  if (isUserPausedQuestStatusGuard({ status: quest.status })) {
    return result;
  }

  // 2. Find ready work items
  const { ready, questTerminal, questBlocked } = nextReadyWorkItemsTransformer({
    workItems: quest.workItems,
  });

  process.stderr.write(
    `${orchestrationLoopSummaryTransformer({
      questId,
      questStatus: quest.status,
      workItems: quest.workItems,
      ready,
      chatRoles: [...CHAT_ROLES],
    })}\n`,
  );

  // 3. Handle terminal states
  // Wrap the modify call in try/catch so smoketest and other minimal-content
  // quests still terminalize even if real-quest gates (spec-completeness,
  // gate-content) reject the in_progress -> complete/blocked transition. A
  // silent swallow here is what was leaving smoketest quests stuck at
  // in_progress and bypassing the post-terminal listener.
  if (questTerminal) {
    // Every work item is terminal. workItemsToQuestStatusTransformer derives `complete` or, when
    // an unrecovered failure remains, `blocked` — so post-terminal listeners (smoketest
    // assertions) always fire on a definite terminal status.
    const newStatus = workItemsToQuestStatusTransformer({
      workItems: quest.workItems,
      operations: quest.operations,
      currentStatus: quest.status,
    });
    process.stderr.write(
      `[orchestration-loop] quest=${questId} decision: all work items terminal -> quest status ${newStatus}\n`,
    );
    if (newStatus !== quest.status) {
      try {
        const transitionResult = await questModifyBroker({
          input: { questId, status: newStatus } as ModifyQuestInput,
        });
        if (!transitionResult.success) {
          process.stderr.write(
            `[orchestration-loop] terminal transition to ${newStatus} failed for questId=${questId}: ${transitionResult.error ?? 'unknown error'}\n`,
          );
        }
      } catch (error: unknown) {
        process.stderr.write(
          `[orchestration-loop] terminal transition to ${newStatus} threw for questId=${questId}: ${String(error)}\n`,
        );
      }
    }
    return result;
  }

  if (questBlocked) {
    process.stderr.write(
      `[orchestration-loop] quest=${questId} decision: no ready items and none in flight -> blocking quest\n`,
    );
    try {
      const transitionResult = await questModifyBroker({
        input: { questId, status: 'blocked' } as ModifyQuestInput,
      });
      if (!transitionResult.success) {
        process.stderr.write(
          `[orchestration-loop] blocked transition failed for questId=${questId}: ${transitionResult.error ?? 'unknown error'}\n`,
        );
      }
    } catch (error: unknown) {
      process.stderr.write(
        `[orchestration-loop] blocked transition threw for questId=${questId}: ${String(error)}\n`,
      );
    }
    return result;
  }

  if (ready.length === 0) {
    const runningCount = quest.workItems.filter((wi) =>
      isActiveWorkItemStatusGuard({ status: wi.status }),
    ).length;
    process.stderr.write(
      `[orchestration-loop] quest=${questId} decision: 0 ready, ${String(runningCount)} in flight -> waiting for active agents\n`,
    );
    return result;
  }

  // This loop only dispatches chat roles (chaoswhisperer / glyphsmith). Every execution role
  // is dispatched by /dumpster-launch via the MCP get-next-step tool, and its work item is
  // flipped to in_progress only when the sub-agent calls get-agent-prompt. Execution-role
  // items are left `pending` here — the loop must not touch their status.
  const chatReady = ready.filter((item) => CHAT_ROLES.has(item.role));
  if (chatReady.length === 0) {
    process.stderr.write(
      `[orchestration-loop] quest=${questId} decision: ${String(ready.length)} ready, 0 chat-role -> execution roles dispatch via the dispatch loop; chat loop idle\n`,
    );
    return result;
  }

  // 4. Single-role concurrency: group ready chat items by role, pick first group
  const roleGroupMap = new Map<WorkItemRole, WorkItem[]>();
  for (const item of chatReady) {
    const group = roleGroupMap.get(item.role);
    if (group) {
      group.push(item);
    } else {
      roleGroupMap.set(item.role, [item]);
    }
  }

  const firstEntry = roleGroupMap.entries().next().value;
  if (!firstEntry) {
    return result;
  }

  const [roleName, roleItemsRaw] = firstEntry;
  let roleItems = roleItemsRaw;

  if (CHAT_ROLES.has(roleName) && userMessage === undefined) {
    return result;
  }

  if (CHAT_ROLES.has(roleName)) {
    const anyInProgress = quest.workItems.some(
      (wi) => CHAT_ROLES.has(wi.role) && isActiveWorkItemStatusGuard({ status: wi.status }),
    );
    if (anyInProgress) {
      return result;
    }
    const [singleItem] = roleItems;
    if (!singleItem) {
      return result;
    }
    roleItems = [singleItem];
  }

  const [firstItem] = roleItems;
  if (!firstItem) {
    return result;
  }

  process.stderr.write(
    `[orchestration-loop] quest=${questId} decision: dispatching ${roleName} (${firstItem.id})\n`,
  );

  // 7. Mark the dispatching chat work item in_progress before handing off to the chat layer.
  const now = new Date().toISOString();
  const workItemStatusUpdates = roleItems.map((wi) => ({
    id: wi.id,
    status: 'in_progress',
    startedAt: now,
  }));
  await questModifyBroker({
    input: {
      questId,
      workItems: workItemStatusUpdates,
    } as ModifyQuestInput,
  });

  // 8. Dispatch to the chat layer (chaoswhisperer / glyphsmith — the only roles this loop runs).
  try {
    await runChatLayerBroker({
      questId,
      workItem: firstItem,
      startPath,
      guildId,
      ...(userMessage === undefined ? {} : { userMessage }),
      onAgentEntry,
    });
  } catch (error: unknown) {
    // On unhandled error: mark all in_progress items as failed to prevent zombies
    // Wrapped in inner try/catch to ensure original error always propagates (double fault safety)
    try {
      const errorNow = new Date().toISOString();
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      await questModifyBroker({
        input: {
          questId,
          workItems: roleItems.map((wi) => ({
            id: wi.id,
            status: 'failed' as const,
            completedAt: errorNow,
            errorMessage: errorMsg,
          })),
        } as ModifyQuestInput,
      });

      // Recalculate quest status (may become blocked)
      const updatedResult = await questGetBroker({ input });
      if (updatedResult.success && updatedResult.quest) {
        const newStatus = workItemsToQuestStatusTransformer({
          workItems: updatedResult.quest.workItems,
          operations: updatedResult.quest.operations,
          currentStatus: updatedResult.quest.status,
        });
        if (newStatus !== updatedResult.quest.status) {
          await questModifyBroker({
            input: { questId, status: newStatus } as ModifyQuestInput,
          });
        }
      }
    } catch {
      // Double fault: error handler itself failed. Swallow inner error to preserve original.
    }
    throw error;
  }

  // 9. Recurse — pass slotCount through so we only resolve config once per quest run
  return questOrchestrationLoopBroker({
    processId,
    questId,
    startPath,
    guildId,
    onAgentEntry,
    abortSignal,
    slotCount,
  });
};
