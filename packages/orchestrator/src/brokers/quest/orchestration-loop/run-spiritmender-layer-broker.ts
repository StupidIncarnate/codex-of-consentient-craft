/**
 * PURPOSE: Runs spiritmender agents via slot manager, resolves wardResults via relatedDataItems
 *
 * USAGE:
 * await runSpiritmenderLayerBroker({ questId, workItems, startPath, slotCount, slotOperations });
 * // Resolves ward error references, runs spiritmender agents, updates work item statuses
 */

import {
  absoluteFilePathContract,
  errorMessageContract,
  filePathContract,
  type AbsoluteFilePath,
  type FilePath,
  type QuestId,
  type QuestWorkItemId,
  type WorkItem,
} from '@dungeonmaster/shared/contracts';

import { followupDepthContract } from '../../../contracts/followup-depth/followup-depth-contract';
import { getQuestInputContract } from '../../../contracts/get-quest-input/get-quest-input-contract';
import type { ModifyQuestInput } from '../../../contracts/modify-quest-input/modify-quest-input-contract';
import type { SlotCount } from '../../../contracts/slot-count/slot-count-contract';
import type { SlotOperations } from '../../../contracts/slot-operations/slot-operations-contract';
import { timeoutMsContract } from '../../../contracts/timeout-ms/timeout-ms-contract';
import type { WorkItemId } from '../../../contracts/work-item-id/work-item-id-contract';
import { workItemIdContract } from '../../../contracts/work-item-id/work-item-id-contract';
import { filePathsToSpiritmenderWorkUnitsTransformer } from '../../../transformers/file-paths-to-spiritmender-work-units/file-paths-to-spiritmender-work-units-transformer';
import { resolveRelatedDataItemTransformer } from '../../../transformers/resolve-related-data-item/resolve-related-data-item-transformer';
import { workUnitsToWorkTrackerTransformer } from '../../../transformers/work-units-to-work-tracker/work-units-to-work-tracker-transformer';
import { slotManagerStatics } from '../../../statics/slot-manager/slot-manager-statics';
import { slotManagerOrchestrateBroker } from '../../slot-manager/orchestrate/slot-manager-orchestrate-broker';
import { questGetBroker } from '../get/quest-get-broker';
import { questModifyBroker } from '../modify/quest-modify-broker';

const MAX_FOLLOWUP_DEPTH = 3;

export const runSpiritmenderLayerBroker = async ({
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
  const questInput = getQuestInputContract.parse({ questId });
  const questResult = await questGetBroker({ input: questInput });
  if (!questResult.success || !questResult.quest) {
    throw new Error(`Quest not found: ${questId}`);
  }
  const { quest } = questResult;

  const timeoutMs = timeoutMsContract.parse(slotManagerStatics.ward.spiritmenderTimeoutMs);
  const maxFollowupDepth = followupDepthContract.parse(MAX_FOLLOWUP_DEPTH);

  const allFilePaths: AbsoluteFilePath[] = [];
  const allErrors: ReturnType<typeof errorMessageContract.parse>[] = [];

  // Build slot mapping for result tracking
  const slotToQuestMap = new Map<WorkItemId, QuestWorkItemId>();

  for (const [i, wi] of workItems.entries()) {
    const slotId = workItemIdContract.parse(`work-item-${String(i)}`);
    slotToQuestMap.set(slotId, wi.id);

    for (const ref of wi.relatedDataItems) {
      const resolved = resolveRelatedDataItemTransformer({ ref, quest });
      if (resolved.collection === 'wardResults') {
        const wardResult = resolved.item;
        for (const fp of wardResult.filePaths) {
          allFilePaths.push(absoluteFilePathContract.parse(fp));
        }
        if (wardResult.errorSummary) {
          allErrors.push(errorMessageContract.parse(wardResult.errorSummary));
        }
      }
    }
  }

  const spiritmenderWorkUnits = filePathsToSpiritmenderWorkUnitsTransformer({
    filePaths: allFilePaths,
    errors: allErrors,
  });

  const workTracker = workUnitsToWorkTrackerTransformer({ workUnits: spiritmenderWorkUnits });

  const result = await slotManagerOrchestrateBroker({
    workTracker,
    slotCount,
    timeoutMs,
    slotOperations,
    startPath: filePathContract.parse(startPath),
    maxFollowupDepth,
  });

  // Map results back to quest work items
  const completedAt = new Date().toISOString();
  const incompleteIds: WorkItemId[] = result.completed ? [] : result.incompleteIds;
  const failedSlotIds = new Set<WorkItemId>(incompleteIds);

  const workItemUpdates: {
    id: QuestWorkItemId;
    status: 'complete' | 'failed';
    completedAt?: typeof completedAt;
  }[] = [];

  for (const [slotId, questItemId] of slotToQuestMap) {
    if (failedSlotIds.has(slotId)) {
      workItemUpdates.push({ id: questItemId, status: 'failed' });
    } else {
      workItemUpdates.push({ id: questItemId, status: 'complete', completedAt });
    }
  }

  await questModifyBroker({
    input: {
      questId,
      workItems: workItemUpdates,
    } as ModifyQuestInput,
  });
};
