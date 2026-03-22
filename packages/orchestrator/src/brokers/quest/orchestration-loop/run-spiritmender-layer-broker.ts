/**
 * PURPOSE: Runs spiritmender agents via slot manager, reads batch files written by runWardLayerBroker
 *
 * USAGE:
 * await runSpiritmenderLayerBroker({ questId, workItems, startPath, slotCount, slotOperations });
 * // Reads batch files from quest folder, creates work units, runs spiritmender agents
 *
 * NOTE: This is orchestrator code. The spiritmender AGENT never reads files — it receives
 * filePaths + errors in its prompt via $ARGUMENTS. The orchestrator is responsible for
 * feeding the agent exactly what it needs.
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import {
  filePathContract,
  type FilePath,
  type QuestId,
  type QuestWorkItemId,
  type WorkItem,
} from '@dungeonmaster/shared/contracts';

import { followupDepthContract } from '../../../contracts/followup-depth/followup-depth-contract';
import type { ModifyQuestInput } from '../../../contracts/modify-quest-input/modify-quest-input-contract';
import type { SlotCount } from '../../../contracts/slot-count/slot-count-contract';
import type { SlotOperations } from '../../../contracts/slot-operations/slot-operations-contract';
import { timeoutMsContract } from '../../../contracts/timeout-ms/timeout-ms-contract';
import type { WorkItemId } from '../../../contracts/work-item-id/work-item-id-contract';
import { workItemIdContract } from '../../../contracts/work-item-id/work-item-id-contract';
import { workUnitContract } from '../../../contracts/work-unit/work-unit-contract';
import { workUnitsToWorkTrackerTransformer } from '../../../transformers/work-units-to-work-tracker/work-units-to-work-tracker-transformer';
import { slotManagerStatics } from '../../../statics/slot-manager/slot-manager-statics';
import { slotManagerOrchestrateBroker } from '../../slot-manager/orchestrate/slot-manager-orchestrate-broker';
import { questFindQuestPathBroker } from '../find-quest-path/quest-find-quest-path-broker';
import { questModifyBroker } from '../modify/quest-modify-broker';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { parseBatchFileTransformer } from '../../../transformers/parse-batch-file/parse-batch-file-transformer';

const MAX_FOLLOWUP_DEPTH = 3;
const SPIRITMENDER_BATCHES_DIR = 'spiritmender-batches';
const JSON_EXTENSION = '.json';

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
  const timeoutMs = timeoutMsContract.parse(slotManagerStatics.ward.spiritmenderTimeoutMs);
  const maxFollowupDepth = followupDepthContract.parse(MAX_FOLLOWUP_DEPTH);

  // Build slot mapping for result tracking
  const slotToQuestMap = new Map<WorkItemId, QuestWorkItemId>();

  // Read batch files for each spiritmender work item (orchestrator reads, not the agent)
  const { questPath } = await questFindQuestPathBroker({ questId });
  const batchesDir = pathJoinAdapter({ paths: [questPath, SPIRITMENDER_BATCHES_DIR] });

  const workUnits = await Promise.all(
    workItems.map(async (wi, i) => {
      const slotId = workItemIdContract.parse(`work-item-${String(i)}`);
      slotToQuestMap.set(slotId, wi.id);

      // Read batch file keyed by work item ID
      const batchFilePath = pathJoinAdapter({
        paths: [batchesDir, `${String(wi.id)}${JSON_EXTENSION}`],
      });

      try {
        const batchContents = await fsReadFileAdapter({ filePath: batchFilePath });
        const { filePaths, errors } = parseBatchFileTransformer({ contents: batchContents });

        return workUnitContract.parse({ role: 'spiritmender', filePaths, errors });
      } catch {
        // Batch file not found or invalid — create empty work unit
        return workUnitContract.parse({ role: 'spiritmender', filePaths: [], errors: [] });
      }
    }),
  );

  const workTracker = workUnitsToWorkTrackerTransformer({ workUnits });

  const result = await slotManagerOrchestrateBroker({
    questId,
    workTracker,
    slotCount,
    timeoutMs,
    slotOperations,
    startPath: filePathContract.parse(startPath),
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

  const workItemUpdates: {
    id: QuestWorkItemId;
    status: 'complete' | 'failed';
    completedAt?: typeof completedAt;
  }[] = [];

  for (const [slotId, questItemId] of slotToQuestMap) {
    const sessionId = result.sessionIds[slotId];
    if (result.completed) {
      workItemUpdates.push({
        id: questItemId,
        status: 'complete',
        completedAt,
        ...(sessionId === undefined ? {} : { sessionId }),
      });
    } else {
      workItemUpdates.push({
        id: questItemId,
        status: 'failed',
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
