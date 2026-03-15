/**
 * PURPOSE: Runs spiritmender agents via slot manager, resolves wardResults via relatedDataItems
 *
 * USAGE:
 * await runSpiritmenderLayerBroker({ questFilePath, workItems, startPath, slotCount, slotOperations });
 * // Resolves ward error references, runs spiritmender agents, updates work item statuses
 */

import {
  absoluteFilePathContract,
  errorMessageContract,
  filePathContract,
  type AbsoluteFilePath,
  type FilePath,
  type WorkItem,
} from '@dungeonmaster/shared/contracts';

import { followupDepthContract } from '../../../contracts/followup-depth/followup-depth-contract';
import type { SlotCount } from '../../../contracts/slot-count/slot-count-contract';
import type { SlotOperations } from '../../../contracts/slot-operations/slot-operations-contract';
import { timeoutMsContract } from '../../../contracts/timeout-ms/timeout-ms-contract';
import { filePathsToSpiritmenderWorkUnitsTransformer } from '../../../transformers/file-paths-to-spiritmender-work-units/file-paths-to-spiritmender-work-units-transformer';
import { resolveRelatedDataItemTransformer } from '../../../transformers/resolve-related-data-item/resolve-related-data-item-transformer';
import { workUnitsToWorkTrackerTransformer } from '../../../transformers/work-units-to-work-tracker/work-units-to-work-tracker-transformer';
import { slotManagerStatics } from '../../../statics/slot-manager/slot-manager-statics';
import { slotManagerOrchestrateBroker } from '../../slot-manager/orchestrate/slot-manager-orchestrate-broker';
import { questLoadBroker } from '../load/quest-load-broker';

const MAX_FOLLOWUP_DEPTH = 3;

export const runSpiritmenderLayerBroker = async ({
  questFilePath,
  workItems,
  startPath,
  slotCount,
  slotOperations,
}: {
  questFilePath: FilePath;
  workItems: WorkItem[];
  startPath: FilePath;
  slotCount: SlotCount;
  slotOperations: SlotOperations;
}): Promise<void> => {
  const quest = await questLoadBroker({ questFilePath });
  const timeoutMs = timeoutMsContract.parse(slotManagerStatics.ward.spiritmenderTimeoutMs);
  const maxFollowupDepth = followupDepthContract.parse(MAX_FOLLOWUP_DEPTH);

  const allFilePaths: AbsoluteFilePath[] = [];
  const allErrors: ReturnType<typeof errorMessageContract.parse>[] = [];

  for (const wi of workItems) {
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

  await slotManagerOrchestrateBroker({
    workTracker,
    slotCount,
    timeoutMs,
    slotOperations,
    startPath: filePathContract.parse(startPath),
    maxFollowupDepth,
  });
};
