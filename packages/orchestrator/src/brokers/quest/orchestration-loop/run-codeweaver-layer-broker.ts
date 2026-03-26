/**
 * PURPOSE: Executes codeweaver work items via slot manager, maps QuestWorkItemId to SlotManager WorkItemId
 *
 * USAGE:
 * await runCodeweaverLayerBroker({questId, workItems, startPath, slotCount, slotOperations});
 * // Resolves steps from relatedDataItems, runs codeweaver agents, updates work item + step statuses
 */

import {
  type FilePath,
  type QuestId,
  type QuestWorkItemId,
  type WorkItem,
  workItemContract,
} from '@dungeonmaster/shared/contracts';

import { followupDepthContract } from '../../../contracts/followup-depth/followup-depth-contract';
import { getQuestInputContract } from '../../../contracts/get-quest-input/get-quest-input-contract';
import type { ModifyQuestInput } from '../../../contracts/modify-quest-input/modify-quest-input-contract';
import type { OnAgentEntryCallback } from '../../../contracts/orchestration-callbacks/orchestration-callbacks-contract';
import type { SlotCount } from '../../../contracts/slot-count/slot-count-contract';
import type { SlotOperations } from '../../../contracts/slot-operations/slot-operations-contract';
import type { WorkItemId } from '../../../contracts/work-item-id/work-item-id-contract';
import { workItemIdContract } from '../../../contracts/work-item-id/work-item-id-contract';
import { buildWorkUnitForRoleTransformer } from '../../../transformers/build-work-unit-for-role/build-work-unit-for-role-transformer';
import { resolveRelatedDataItemTransformer } from '../../../transformers/resolve-related-data-item/resolve-related-data-item-transformer';
import { workUnitsToWorkTrackerTransformer } from '../../../transformers/work-units-to-work-tracker/work-units-to-work-tracker-transformer';
import { slotManagerStatics } from '../../../statics/slot-manager/slot-manager-statics';
import { questGetBroker } from '../get/quest-get-broker';
import { questModifyBroker } from '../modify/quest-modify-broker';
import { slotManagerOrchestrateBroker } from '../../slot-manager/orchestrate/slot-manager-orchestrate-broker';

export const runCodeweaverLayerBroker = async ({
  questId,
  workItems,
  startPath,
  slotCount,
  slotOperations,
  onAgentEntry,
  abortSignal,
}: {
  questId: QuestId;
  workItems: WorkItem[];
  startPath: FilePath;
  slotCount: SlotCount;
  slotOperations: SlotOperations;
  onAgentEntry: OnAgentEntryCallback;
  abortSignal: AbortSignal;
}): Promise<void> => {
  const maxFollowupDepth = followupDepthContract.parse(
    slotManagerStatics.codeweaver.maxFollowupDepth,
  );

  const questInput = getQuestInputContract.parse({ questId });
  const questResult = await questGetBroker({ input: questInput });
  if (!questResult.success || !questResult.quest) {
    throw new Error(`Quest not found: ${questId}`);
  }
  const { quest } = questResult;

  // Resolve relatedDataItems -> steps, build mapping: slotManagerWorkItemId -> questWorkItemId
  const slotToQuestMap = new Map<WorkItemId, QuestWorkItemId>();
  const workUnits = workItems.map((wi, i) => {
    const [ref] = wi.relatedDataItems;
    if (!ref) {
      throw new Error(`Work item ${wi.id} has no relatedDataItems`);
    }
    const resolved = resolveRelatedDataItemTransformer({ ref, quest });
    if (resolved.collection !== 'steps') {
      throw new Error(`Expected steps reference, got ${resolved.collection}`);
    }
    const slotId = workItemIdContract.parse(`work-item-${String(i)}`);
    slotToQuestMap.set(slotId, wi.id);
    return buildWorkUnitForRoleTransformer({ role: 'codeweaver', step: resolved.item, quest });
  });

  const workTracker = workUnitsToWorkTrackerTransformer({ workUnits });

  const result = await slotManagerOrchestrateBroker({
    questId,
    workTracker,
    slotCount,
    slotOperations,
    startPath,
    maxFollowupDepth,
    abortSignal,
    onAgentEntry,
    onFollowupCreated: ({ followupWorkItemId, role, failedWorkItemId }) => {
      const questItemId = slotToQuestMap.get(failedWorkItemId);
      if (questItemId) {
        const newItem = workItemContract.parse({
          id: crypto.randomUUID(),
          role,
          status: 'pending',
          spawnerType: 'agent',
          dependsOn: [questItemId],
          insertedBy: questItemId,
          createdAt: new Date().toISOString(),
        });
        slotToQuestMap.set(followupWorkItemId, newItem.id);
        questModifyBroker({
          input: {
            questId,
            workItems: [newItem],
          } as ModifyQuestInput,
        }).catch((error: unknown) => {
          process.stderr.write(`[codeweaver] quest-modify failed: ${String(error)}\n`);
        });
      }
    },
    onWorkItemSessionId: ({ workItemId, sessionId }) => {
      const questItemId = slotToQuestMap.get(workItemId);
      if (questItemId !== undefined) {
        questModifyBroker({
          input: {
            questId,
            workItems: [{ id: questItemId, sessionId }],
          } as ModifyQuestInput,
        }).catch((error: unknown) => {
          process.stderr.write(`[codeweaver] quest-modify failed: ${String(error)}\n`);
        });
      }
    },
  });

  // Map slot manager results back to quest work items
  const completedAt = new Date().toISOString();
  const failedIds: WorkItemId[] = result.completed ? [] : result.failedIds;
  const failedSlotIds = new Set<WorkItemId>(failedIds);

  const workItemUpdates: {
    id: QuestWorkItemId;
    status: 'complete' | 'failed';
    completedAt?: typeof completedAt;
  }[] = [];

  for (const [slotId, questItemId] of slotToQuestMap) {
    const sessionId = result.sessionIds[slotId];
    if (failedSlotIds.has(slotId)) {
      workItemUpdates.push({
        id: questItemId,
        status: 'failed',
        ...(sessionId === undefined ? {} : { sessionId }),
      });
    } else {
      workItemUpdates.push({
        id: questItemId,
        status: 'complete',
        completedAt,
        ...(sessionId === undefined ? {} : { sessionId }),
      });
    }
  }

  await questModifyBroker({
    input: {
      questId,
      workItems: workItemUpdates,
    } as ModifyQuestInput,
  });
};
