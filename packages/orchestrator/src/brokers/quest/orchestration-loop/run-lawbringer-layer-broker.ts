/**
 * PURPOSE: Executes lawbringer work items via slot manager, resolves relatedDataItems to steps for file pairs
 *
 * USAGE:
 * await runLawbringerLayerBroker({questId, workItems, startPath, slotCount, slotOperations});
 * // Resolves steps from relatedDataItems, runs lawbringer agents, maps results back to quest work items
 */

import type { FilePath, QuestId, QuestWorkItemId, WorkItem } from '@dungeonmaster/shared/contracts';

import { followupDepthContract } from '../../../contracts/followup-depth/followup-depth-contract';
import { getQuestInputContract } from '../../../contracts/get-quest-input/get-quest-input-contract';
import type { ModifyQuestInput } from '../../../contracts/modify-quest-input/modify-quest-input-contract';
import type { SlotCount } from '../../../contracts/slot-count/slot-count-contract';
import type { SlotOperations } from '../../../contracts/slot-operations/slot-operations-contract';
import { timeoutMsContract } from '../../../contracts/timeout-ms/timeout-ms-contract';
import type { WorkItemId } from '../../../contracts/work-item-id/work-item-id-contract';
import { workItemIdContract } from '../../../contracts/work-item-id/work-item-id-contract';
import { slotManagerStatics } from '../../../statics/slot-manager/slot-manager-statics';
import { buildWorkUnitForRoleTransformer } from '../../../transformers/build-work-unit-for-role/build-work-unit-for-role-transformer';
import { resolveRelatedDataItemTransformer } from '../../../transformers/resolve-related-data-item/resolve-related-data-item-transformer';
import { workUnitsToWorkTrackerTransformer } from '../../../transformers/work-units-to-work-tracker/work-units-to-work-tracker-transformer';
import { questGetBroker } from '../get/quest-get-broker';
import { questModifyBroker } from '../modify/quest-modify-broker';
import { slotManagerOrchestrateBroker } from '../../slot-manager/orchestrate/slot-manager-orchestrate-broker';

export const runLawbringerLayerBroker = async ({
  questId,
  workItems,
  startPath,
  slotCount,
  slotOperations,
}: {
  questId: QuestId;
  workItems: WorkItem[];
  startPath: FilePath;
  slotCount: SlotCount;
  slotOperations: SlotOperations;
}): Promise<void> => {
  const timeoutMs = timeoutMsContract.parse(slotManagerStatics.lawbringer.timeoutMs);
  const maxFollowupDepth = followupDepthContract.parse(
    slotManagerStatics.lawbringer.maxFollowupDepth,
  );

  const questInput = getQuestInputContract.parse({ questId });
  const questResult = await questGetBroker({ input: questInput });
  if (!questResult.success || !questResult.quest) {
    throw new Error(`Quest not found: ${questId}`);
  }
  const { quest } = questResult;

  // Resolve relatedDataItems -> steps, build mapping
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
    return buildWorkUnitForRoleTransformer({ role: 'lawbringer', step: resolved.item, quest });
  });

  const workTracker = workUnitsToWorkTrackerTransformer({ workUnits });

  const result = await slotManagerOrchestrateBroker({
    questId,
    workTracker,
    slotCount,
    timeoutMs,
    slotOperations,
    startPath,
    maxFollowupDepth,
    onWorkItemSessionId: ({ workItemId, sessionId }) => {
      const questItemId = slotToQuestMap.get(workItemId);
      if (questItemId !== undefined) {
        questModifyBroker({
          input: {
            questId,
            workItems: [{ id: questItemId, sessionId }],
          } as ModifyQuestInput,
        }).catch(() => undefined);
      }
    },
  });

  // Map results back to quest work items
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
