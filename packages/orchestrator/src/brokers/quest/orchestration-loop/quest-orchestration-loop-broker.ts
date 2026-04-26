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
  FolderTypeGroups,
  ProcessId,
  QuestId,
  UserInput,
  WorkItem,
  WorkItemRole,
} from '@dungeonmaster/shared/contracts';
import { folderTypeGroupsContract } from '@dungeonmaster/shared/contracts';
import { adapterResultContract } from '@dungeonmaster/shared/contracts';

import type { ModifyQuestInput } from '@dungeonmaster/shared/contracts';
import type { OnAgentEntryCallback } from '../../../contracts/orchestration-callbacks/orchestration-callbacks-contract';
import { slotCountContract } from '../../../contracts/slot-count/slot-count-contract';
import { getQuestInputContract } from '@dungeonmaster/shared/contracts';
import {
  isActiveWorkItemStatusGuard,
  isFailureWorkItemStatusGuard,
  isUserPausedQuestStatusGuard,
} from '@dungeonmaster/shared/guards';
import { dungeonmasterConfigResolveAdapter } from '../../../adapters/dungeonmaster-config/resolve/dungeonmaster-config-resolve-adapter';
import { slotCountToSlotOperationsTransformer } from '../../../transformers/slot-count-to-slot-operations/slot-count-to-slot-operations-transformer';
import { nextReadyWorkItemsTransformer } from '../../../transformers/next-ready-work-items/next-ready-work-items-transformer';
import { workItemsToQuestStatusTransformer } from '../../../transformers/work-items-to-quest-status/work-items-to-quest-status-transformer';
import { questGetBroker } from '../get/quest-get-broker';
import { questModifyBroker } from '../modify/quest-modify-broker';
import { runBlightwardenLayerBroker } from './run-blightwarden-layer-broker';
import { runChatLayerBroker } from './run-chat-layer-broker';
import { runCodeweaverLayerBroker } from './run-codeweaver-layer-broker';
import { runLawbringerLayerBroker } from './run-lawbringer-layer-broker';
import { runPathseekerLayerBroker } from './run-pathseeker-layer-broker';
import { runSiegemasterLayerBroker } from './run-siegemaster-layer-broker';
import { runSpiritmenderLayerBroker } from './run-spiritmender-layer-broker';
import { runWardLayerBroker } from './run-ward-layer-broker';

const SLOT_COUNT = 3;

const CHAT_ROLES = new Set<WorkItemRole>([
  'chaoswhisperer' as WorkItemRole,
  'glyphsmith' as WorkItemRole,
]);

// Roles whose layer brokers fan work out through slot-manager-orchestrate-broker.
// For these, only the first SLOT_COUNT items actually dispatch immediately — the rest
// are held by the slot manager and should be surfaced as `queued` instead of `in_progress`
// so the UI can distinguish "ready, waiting for slot" from "actually running".
const SLOT_MANAGED_ROLES = new Set<WorkItemRole>([
  'codeweaver' as WorkItemRole,
  'lawbringer' as WorkItemRole,
  'spiritmender' as WorkItemRole,
]);

export const questOrchestrationLoopBroker = async ({
  processId,
  questId,
  startPath,
  onAgentEntry,
  abortSignal,
  userMessage,
  batchGroups: providedBatchGroups,
}: {
  processId: ProcessId;
  questId: QuestId;
  startPath: FilePath;
  onAgentEntry: OnAgentEntryCallback;
  abortSignal: AbortSignal;
  userMessage?: UserInput;
  batchGroups?: FolderTypeGroups;
}): Promise<AdapterResult> => {
  const result = adapterResultContract.parse({ success: true });
  if (abortSignal.aborted) {
    return result;
  }

  const slotCount = slotCountContract.parse(SLOT_COUNT);
  const slotOperations = slotCountToSlotOperationsTransformer({ slotCount });

  // Resolve batchGroups from project config ONCE per quest run, then propagate
  // through the recursive loop. A missing `.dungeonmaster` file (end-user installs,
  // temp environments) is not an error — fall back to the curated default the
  // contract would have produced.
  const batchGroups: FolderTypeGroups =
    providedBatchGroups ??
    (await (async (): Promise<FolderTypeGroups> => {
      try {
        const config = await dungeonmasterConfigResolveAdapter({ startPath });
        return config.agents?.batchGroups ?? folderTypeGroupsContract.parse(undefined);
      } catch {
        return folderTypeGroupsContract.parse(undefined);
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

  const workItemSummary = quest.workItems.map((wi) => `${wi.role}:${wi.status}`).join(', ');
  process.stderr.write(
    `[dev] orchestration-loop questId=${questId} ready=${String(ready.length)} terminal=${String(questTerminal)} blocked=${String(questBlocked)} items=[${workItemSummary}]\n`,
  );

  // 3. Handle terminal states
  // Wrap the modify call in try/catch so smoketest and other minimal-content
  // quests still terminalize even if real-quest gates (spec-completeness,
  // gate-content) reject the in_progress -> complete/blocked transition. A
  // silent swallow here is what was leaving smoketest quests stuck at
  // in_progress and bypassing the post-terminal listener.
  if (questTerminal) {
    const transformedStatus = workItemsToQuestStatusTransformer({
      workItems: quest.workItems,
      currentStatus: quest.status,
    });
    // When every work item is terminal but transformedStatus didn't transition
    // (e.g. all-terminal-with-failures + no pending dependents leaves
    // workItemsToQuestStatusTransformer falling through to currentStatus),
    // force `blocked` so the quest reaches a terminal status and post-terminal
    // listeners (smoketest assertions) fire.
    const hasFailures = quest.workItems.some((item) =>
      isFailureWorkItemStatusGuard({ status: item.status }),
    );
    const newStatus =
      transformedStatus === quest.status && hasFailures ? 'blocked' : transformedStatus;
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
    process.stderr.write(`[dev] orchestration-loop questId=${questId} no ready items, exiting\n`);
    return result;
  }

  // 4. Single-role concurrency: group ready items by role, pick first group
  const roleGroupMap = new Map<WorkItemRole, WorkItem[]>();
  for (const item of ready) {
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

  // 7. Mark items that will actually dispatch now as in_progress, and any overflow
  // (for slot-managed roles with more items than slots) as queued. The layer broker's
  // slot-manager will work through the queued ones as slots free up, and its terminal
  // write will transition them directly to complete/failed.
  const now = new Date().toISOString();
  const isSlotManagedRole = SLOT_MANAGED_ROLES.has(roleName);
  const immediateCount = isSlotManagedRole ? SLOT_COUNT : roleItems.length;
  const workItemStatusUpdates = roleItems.map((wi, index) => ({
    id: wi.id,
    status: index < immediateCount ? 'in_progress' : 'queued',
    startedAt: now,
  }));
  await questModifyBroker({
    input: {
      questId,
      workItems: workItemStatusUpdates,
    } as ModifyQuestInput,
  });

  // 8. Dispatch to role-specific layer broker
  try {
    if (roleName === 'chaoswhisperer' || roleName === 'glyphsmith') {
      await runChatLayerBroker({
        questId,
        workItem: firstItem,
        startPath,
        ...(userMessage === undefined ? {} : { userMessage }),
        onAgentEntry,
      });
    } else if (roleName === 'pathseeker') {
      await runPathseekerLayerBroker({
        questId,
        workItem: firstItem,
        startPath,
        onAgentEntry,
        abortSignal,
        batchGroups,
      });
    } else if (roleName === 'codeweaver') {
      await runCodeweaverLayerBroker({
        questId,
        workItems: roleItems,
        startPath,
        slotCount,
        slotOperations,
        onAgentEntry,
        abortSignal,
      });
    } else if (roleName === 'ward') {
      await runWardLayerBroker({
        questId,
        workItem: firstItem,
        startPath,
        onAgentEntry,
        abortSignal,
      });
    } else if (roleName === 'siegemaster') {
      await runSiegemasterLayerBroker({
        questId,
        workItem: firstItem,
        startPath,
        onAgentEntry,
        abortSignal,
      });
    } else if (roleName === 'lawbringer') {
      await runLawbringerLayerBroker({
        questId,
        workItems: roleItems,
        startPath,
        slotCount,
        slotOperations,
        onAgentEntry,
        abortSignal,
      });
    } else if (roleName === 'blightwarden') {
      await runBlightwardenLayerBroker({
        questId,
        workItem: firstItem,
        startPath,
        onAgentEntry,
        abortSignal,
      });
    } else {
      // roleName === 'spiritmender' (exhaustive via WorkItemRole enum)
      await runSpiritmenderLayerBroker({
        questId,
        workItems: roleItems,
        startPath,
        slotCount,
        slotOperations,
        onAgentEntry,
        abortSignal,
      });
    }
  } catch (error: unknown) {
    if (abortSignal.aborted) {
      return result;
    }

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

  // 9. Recurse — pass batchGroups through so we only resolve config once per quest run
  return questOrchestrationLoopBroker({
    processId,
    questId,
    startPath,
    onAgentEntry,
    abortSignal,
    batchGroups,
  });
};
