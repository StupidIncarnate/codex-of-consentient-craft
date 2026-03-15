/**
 * PURPOSE: Drives quest execution by processing work item queue — find ready items, dispatch to role-specific layer brokers
 *
 * USAGE:
 * await questOrchestrationLoopBroker({processId, questId, startPath});
 * // Loops until all items complete, quest blocked, or waiting for user
 */

import type {
  FilePath,
  ProcessId,
  QuestId,
  UserInput,
  WorkItem,
  WorkItemRole,
} from '@dungeonmaster/shared/contracts';

import type { ChatLineEntry } from '../../../contracts/chat-line-output/chat-line-output-contract';
import type { ModifyQuestInput } from '../../../contracts/modify-quest-input/modify-quest-input-contract';
import { slotCountContract } from '../../../contracts/slot-count/slot-count-contract';
import type { SlotIndex } from '../../../contracts/slot-index/slot-index-contract';
import { getQuestInputContract } from '../../../contracts/get-quest-input/get-quest-input-contract';
import { slotCountToSlotOperationsTransformer } from '../../../transformers/slot-count-to-slot-operations/slot-count-to-slot-operations-transformer';
import { nextReadyWorkItemsTransformer } from '../../../transformers/next-ready-work-items/next-ready-work-items-transformer';
import { workItemsToQuestStatusTransformer } from '../../../transformers/work-items-to-quest-status/work-items-to-quest-status-transformer';
import { questGetBroker } from '../get/quest-get-broker';
import { questModifyBroker } from '../modify/quest-modify-broker';
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

export const questOrchestrationLoopBroker = async ({
  processId,
  questId,
  startPath,
  onAgentEntry,
  abortSignal,
  userMessage,
}: {
  processId: ProcessId;
  questId: QuestId;
  startPath: FilePath;
  onAgentEntry?: (params: { slotIndex: SlotIndex; entry: ChatLineEntry['entry'] }) => void;
  abortSignal?: AbortSignal;
  userMessage?: UserInput;
}): Promise<void> => {
  if (abortSignal?.aborted) {
    return;
  }

  const slotCount = slotCountContract.parse(SLOT_COUNT);
  const slotOperations = slotCountToSlotOperationsTransformer({ slotCount });

  // 1. Load quest
  const input = getQuestInputContract.parse({ questId });
  const result = await questGetBroker({ input });

  if (!result.success || !result.quest) {
    throw new Error(`Quest not found: ${questId}`);
  }

  const { quest } = result;

  // 2. Find ready work items
  const { ready, questTerminal, questBlocked } = nextReadyWorkItemsTransformer({
    workItems: quest.workItems,
  });

  // 3. Handle terminal states
  if (questTerminal) {
    const newStatus = workItemsToQuestStatusTransformer({
      workItems: quest.workItems,
      currentStatus: quest.status,
    });
    if (newStatus !== quest.status) {
      await questModifyBroker({ input: { questId, status: newStatus } as ModifyQuestInput });
    }
    return;
  }

  if (questBlocked) {
    await questModifyBroker({ input: { questId, status: 'blocked' } as ModifyQuestInput });
    return;
  }

  if (ready.length === 0) {
    return; // items in_progress elsewhere, or waiting for user
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
    return;
  }

  const [roleName, roleItemsRaw] = firstEntry;
  let roleItems = roleItemsRaw;

  // 5. Skip chaos/glyph on auto-recovery (no connected user providing userMessage)
  if (CHAT_ROLES.has(roleName) && userMessage === undefined) {
    return;
  }

  // 6. Enforce single chaos/glyph constraint
  if (CHAT_ROLES.has(roleName)) {
    const anyInProgress = quest.workItems.some(
      (wi) => CHAT_ROLES.has(wi.role) && wi.status === 'in_progress',
    );
    if (anyInProgress) {
      return;
    }
    const [singleItem] = roleItems;
    if (!singleItem) {
      return;
    }
    roleItems = [singleItem];
  }

  const [firstItem] = roleItems;
  if (!firstItem) {
    return;
  }

  // 7. Mark all items in this role group as in_progress
  const now = new Date().toISOString();
  await questModifyBroker({
    input: {
      questId,
      workItems: roleItems.map((wi) => ({
        id: wi.id,
        status: 'in_progress' as const,
        startedAt: now,
      })),
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
        ...(onAgentEntry === undefined ? {} : { onAgentEntry }),
      });
    } else if (roleName === 'pathseeker') {
      await runPathseekerLayerBroker({
        questId,
        workItem: firstItem,
        startPath,
        ...(onAgentEntry === undefined ? {} : { onAgentEntry }),
      });
    } else if (roleName === 'codeweaver') {
      await runCodeweaverLayerBroker({
        questId,
        workItems: roleItems,
        startPath,
        slotCount,
        slotOperations,
        ...(onAgentEntry === undefined ? {} : { onAgentEntry }),
      });
    } else if (roleName === 'ward') {
      await runWardLayerBroker({
        questId,
        workItem: firstItem,
        startPath,
      });
    } else if (roleName === 'siegemaster') {
      await runSiegemasterLayerBroker({
        questId,
        workItem: firstItem,
        startPath,
      });
    } else if (roleName === 'lawbringer') {
      await runLawbringerLayerBroker({
        questId,
        workItems: roleItems,
        startPath,
        slotCount,
        slotOperations,
      });
    } else {
      // roleName === 'spiritmender' (exhaustive via WorkItemRole enum)
      await runSpiritmenderLayerBroker({
        questId,
        workItems: roleItems,
        startPath,
        slotCount,
        slotOperations,
      });
    }
  } catch (error: unknown) {
    // On unhandled error: mark all in_progress items as failed to prevent zombies
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
    throw error;
  }

  // 9. Recurse
  return questOrchestrationLoopBroker({
    processId,
    questId,
    startPath,
    ...(onAgentEntry === undefined ? {} : { onAgentEntry }),
    ...(abortSignal === undefined ? {} : { abortSignal }),
  });
};
