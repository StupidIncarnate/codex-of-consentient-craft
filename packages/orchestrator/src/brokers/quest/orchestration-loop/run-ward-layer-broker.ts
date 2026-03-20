/**
 * PURPOSE: Executes ward phase — runs ward, stores wardResult on failure, creates spiritmender + retry items
 *
 * USAGE:
 * await runWardLayerBroker({questId, workItem, startPath});
 * // Runs ward command, on failure creates spiritmender items and ward retry via insertBroker
 */

import {
  absoluteFilePathContract,
  wardResultContract,
  workItemContract,
  type FilePath,
  type QuestId,
  type WorkItem,
} from '@dungeonmaster/shared/contracts';

import { getQuestInputContract } from '../../../contracts/get-quest-input/get-quest-input-contract';
import type { ModifyQuestInput } from '../../../contracts/modify-quest-input/modify-quest-input-contract';
import { questStepsToAbsoluteFilePathsTransformer } from '../../../transformers/quest-steps-to-absolute-file-paths/quest-steps-to-absolute-file-paths-transformer';
import { wardOutputToFilePathsTransformer } from '../../../transformers/ward-output-to-file-paths/ward-output-to-file-paths-transformer';
import { questGetBroker } from '../get/quest-get-broker';
import { questModifyBroker } from '../modify/quest-modify-broker';
import { questWorkItemInsertBroker } from '../work-item-insert/quest-work-item-insert-broker';
import { spawnWardLayerBroker } from './spawn-ward-layer-broker';

export const runWardLayerBroker = async ({
  questId,
  workItem,
  startPath,
}: {
  questId: QuestId;
  workItem: WorkItem;
  startPath: FilePath;
}): Promise<void> => {
  const absoluteStartPath = absoluteFilePathContract.parse(startPath);
  const { exitCode, wardResultJson } = await spawnWardLayerBroker({ startPath: absoluteStartPath });

  if (exitCode === 0) {
    // Ward passed — mark complete
    await questModifyBroker({
      input: {
        questId,
        workItems: [{ id: workItem.id, status: 'complete', completedAt: new Date().toISOString() }],
      } as ModifyQuestInput,
    });
    return;
  }

  // Ward failed — extract file paths
  let filePaths = wardResultJson ? wardOutputToFilePathsTransformer({ wardResultJson }) : [];

  if (filePaths.length === 0) {
    const questInput = getQuestInputContract.parse({ questId });
    const questResult = await questGetBroker({ input: questInput });
    if (questResult.success && questResult.quest) {
      filePaths = questStepsToAbsoluteFilePathsTransformer({ steps: questResult.quest.steps });
    }
  }

  // Store ward result at quest level
  const wardResult = wardResultContract.parse({
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    exitCode,
    filePaths,
    ...(wardResultJson ? { errorSummary: wardResultJson } : {}),
  });

  await questModifyBroker({
    input: {
      questId,
      wardResults: [wardResult],
    } as ModifyQuestInput,
  });

  // Mark current ward as failed
  const completedAt = new Date().toISOString();
  await questModifyBroker({
    input: {
      questId,
      workItems: [{ id: workItem.id, status: 'failed', completedAt, errorMessage: 'ward_failed' }],
    } as ModifyQuestInput,
  });

  // Check retry budget
  if (workItem.attempt >= workItem.maxAttempts - 1) {
    // Retries exhausted — skip all pending items and create pathseeker replan
    const questInput = getQuestInputContract.parse({ questId });
    const exhaustedResult = await questGetBroker({ input: questInput });
    if (exhaustedResult.success && exhaustedResult.quest) {
      const pendingSkips = exhaustedResult.quest.workItems
        .filter((item) => item.status === 'pending')
        .map((item) => ({ id: item.id, status: 'skipped' as const, completedAt }));

      if (pendingSkips.length > 0) {
        await questModifyBroker({
          input: {
            questId,
            workItems: pendingSkips,
          } as ModifyQuestInput,
        });
      }

      // Re-fetch after skip modifications
      const freshResult = await questGetBroker({ input: questInput });
      if (freshResult.success && freshResult.quest) {
        const pathseekerReplan = workItemContract.parse({
          id: crypto.randomUUID(),
          role: 'pathseeker',
          status: 'pending',
          spawnerType: 'agent',
          dependsOn: [workItem.id],
          maxAttempts: 3,
          createdAt: new Date().toISOString(),
          insertedBy: workItem.id,
        });

        await questWorkItemInsertBroker({
          questId,
          quest: freshResult.quest,
          newWorkItems: [pathseekerReplan],
        });
      }
    }
    return;
  }

  // Create spiritmender work items referencing the ward result
  const spiritItems =
    filePaths.length > 0
      ? [
          workItemContract.parse({
            id: crypto.randomUUID(),
            role: 'spiritmender',
            status: 'pending',
            spawnerType: 'agent',
            relatedDataItems: [`wardResults/${String(wardResult.id)}`],
            dependsOn: [workItem.id],
            maxAttempts: 1,
            createdAt: new Date().toISOString(),
            insertedBy: workItem.id,
          }),
        ]
      : [];

  // Create ward retry that depends on all spiritmender items
  const wardRetry = workItemContract.parse({
    id: crypto.randomUUID(),
    role: 'ward',
    status: 'pending',
    spawnerType: 'command',
    dependsOn: spiritItems.map((s) => s.id),
    attempt: workItem.attempt + 1,
    maxAttempts: workItem.maxAttempts,
    createdAt: new Date().toISOString(),
    insertedBy: workItem.id,
  });

  // Update downstream (siege) to depend on wardRetry instead of this ward
  const replacementMapping = [{ oldId: workItem.id, newId: wardRetry.id }];

  const questInput = getQuestInputContract.parse({ questId });
  const questResult = await questGetBroker({ input: questInput });
  if (questResult.success && questResult.quest) {
    await questWorkItemInsertBroker({
      questId,
      quest: questResult.quest,
      newWorkItems: [...spiritItems, wardRetry],
      replacementMapping: replacementMapping.map((m) => ({
        oldId: m.oldId,
        newId: m.newId,
      })),
    });
  }
};
