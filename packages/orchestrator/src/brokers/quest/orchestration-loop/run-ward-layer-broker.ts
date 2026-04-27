/**
 * PURPOSE: Executes ward phase — streams output to web, persists trimmed detail, creates batched spiritmenders on failure
 *
 * USAGE:
 * await runWardLayerBroker({questId, workItem, startPath, onAgentEntry});
 * // Runs ward, streams output, saves detail to quest folder, creates spiritmender batches on failure
 */

import { fsMkdirAdapter, pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import {
  absoluteFilePathContract,
  adapterResultContract,
  fileContentsContract,
  filePathContract,
  sessionIdContract,
  wardResultContract,
  workItemContract,
  type AdapterResult,
  type FilePath,
  type QuestId,
  type WorkItem,
} from '@dungeonmaster/shared/contracts';

import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';

import { getQuestInputContract } from '@dungeonmaster/shared/contracts';
import {
  isCompleteWorkItemStatusGuard,
  isPendingWorkItemStatusGuard,
} from '@dungeonmaster/shared/guards';
import type { ModifyQuestInput } from '@dungeonmaster/shared/contracts';
import type { OnAgentEntryCallback } from '../../../contracts/orchestration-callbacks/orchestration-callbacks-contract';
import { slotIndexContract } from '../../../contracts/slot-index/slot-index-contract';
import { slotManagerStatics } from '../../../statics/slot-manager/slot-manager-statics';
import { spiritmenderContextStatics } from '../../../statics/spiritmender-context/spiritmender-context-statics';
import { wardDetailToSpiritmenderBatchesTransformer } from '../../../transformers/ward-detail-to-spiritmender-batches/ward-detail-to-spiritmender-batches-transformer';
import { wardDetailBroker } from '../../ward/detail/ward-detail-broker';
import { wardPersistResultBroker } from '../../ward/persist-result/ward-persist-result-broker';
import { questFindQuestPathBroker } from '../find-quest-path/quest-find-quest-path-broker';
import { questGetBroker } from '../get/quest-get-broker';
import { questModifyBroker } from '../modify/quest-modify-broker';
import { questWorkItemInsertBroker } from '../work-item-insert/quest-work-item-insert-broker';
import { spawnWardLayerBroker } from './spawn-ward-layer-broker';

const WARD_SESSION_PREFIX = 'ward-';
const WARD_SLOT_INDEX = slotIndexContract.parse(0);
const LOG_SNIPPET_LENGTH = 200;

export const runWardLayerBroker = async ({
  questId,
  workItem,
  startPath,
  onAgentEntry,
  abortSignal,
}: {
  questId: QuestId;
  workItem: WorkItem;
  startPath: FilePath;
  onAgentEntry: OnAgentEntryCallback;
  abortSignal: AbortSignal;
}): Promise<AdapterResult> => {
  const result = adapterResultContract.parse({ success: true });
  const absoluteStartPath = absoluteFilePathContract.parse(startPath);

  // Generate synthetic session ID for ward output streaming
  const wardSessionId = sessionIdContract.parse(WARD_SESSION_PREFIX + crypto.randomUUID());

  process.stderr.write(
    `[dev] ward:start questId=${questId} workItemId=${workItem.id} sessionId=${wardSessionId} hasOnAgentEntry=true\n`,
  );

  // Store session ID on work item before spawning
  await questModifyBroker({
    input: {
      questId,
      workItems: [{ id: workItem.id, sessionId: wardSessionId }],
    } as ModifyQuestInput,
  });

  // Spawn ward with streaming
  const { exitCode, runId } = await spawnWardLayerBroker({
    startPath: absoluteStartPath,
    ...(workItem.wardMode === undefined ? {} : { wardMode: workItem.wardMode }),
    onLine: (line: string) => {
      process.stderr.write(`[dev] ward:output ${line.slice(0, LOG_SNIPPET_LENGTH)}\n`);
      onAgentEntry({
        slotIndex: WARD_SLOT_INDEX,
        entry: { raw: line },
        questWorkItemId: workItem.id,
        sessionId: wardSessionId,
      });
    },
    abortSignal,
  });

  process.stderr.write(
    `[dev] ward:complete exitCode=${String(exitCode)} runId=${String(runId)} workItemId=${workItem.id} aborted=${String(abortSignal.aborted)}\n`,
  );

  if (abortSignal.aborted) {
    return result;
  }

  // Fetch and persist ward detail (pass or fail)
  const detailJson = runId ? await wardDetailBroker({ startPath: absoluteStartPath, runId }) : null;

  const wardResultId = crypto.randomUUID();

  if (detailJson) {
    const { questPath } = await questFindQuestPathBroker({ questId });
    await wardPersistResultBroker({
      questFolderPath: filePathContract.parse(questPath),
      wardResultId,
      detailJson,
    });
  }

  // Store lightweight ward result in quest.json
  const wardResult = wardResultContract.parse({
    id: wardResultId,
    createdAt: new Date().toISOString(),
    exitCode,
    ...(runId ? { runId: String(runId) } : {}),
    ...(workItem.wardMode ? { wardMode: workItem.wardMode } : {}),
  });

  await questModifyBroker({
    input: {
      questId,
      wardResults: [wardResult],
    } as ModifyQuestInput,
  });

  if (exitCode === 0) {
    await questModifyBroker({
      input: {
        questId,
        workItems: [{ id: workItem.id, status: 'complete', completedAt: new Date().toISOString() }],
      } as ModifyQuestInput,
    });
    return result;
  }

  // Ward failed — mark as failed
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
        .filter((item) => isPendingWorkItemStatusGuard({ status: item.status }))
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
    return result;
  }

  // Create batched spiritmender work items
  const batches = detailJson
    ? wardDetailToSpiritmenderBatchesTransformer({
        detailJson,
        batchSize: slotManagerStatics.ward.spiritmenderBatchSize,
      })
    : [];

  const spiritItems = batches.map((batch) => {
    const spiritId = crypto.randomUUID();

    return {
      workItem: workItemContract.parse({
        id: spiritId,
        role: 'spiritmender',
        status: 'pending',
        spawnerType: 'agent',
        dependsOn: [workItem.id],
        maxAttempts: 1,
        createdAt: new Date().toISOString(),
        insertedBy: workItem.id,
      }),
      batch,
    };
  });

  // Fetch quest state BEFORE writing batch files so we can select the correct
  // spiritmender context preamble. If Blightwarden already ran successfully,
  // spiritmenders need the post-Blightwarden warning (don't re-add intentionally
  // deleted code) instead of the default ward-failure preamble.
  const questInput = getQuestInputContract.parse({ questId });
  const questResult = await questGetBroker({ input: questInput });
  const blightwardenRan =
    questResult.success && questResult.quest
      ? questResult.quest.workItems.some(
          (wi) =>
            wi.role === 'blightwarden' && isCompleteWorkItemStatusGuard({ status: wi.status }),
        )
      : false;
  const contextInstructions = blightwardenRan
    ? spiritmenderContextStatics.postBlightwardenFailure.instructions
    : spiritmenderContextStatics.wardFailure.instructions;

  // Write batch files for each spiritmender (keyed by work item ID)
  if (spiritItems.length > 0) {
    const { questPath } = await questFindQuestPathBroker({ questId });
    const batchesDir = pathJoinAdapter({ paths: [questPath, 'spiritmender-batches'] });
    await fsMkdirAdapter({ filepath: batchesDir });

    await Promise.all(
      spiritItems.map(async (spiritItem) => {
        const batchFilePath = pathJoinAdapter({
          paths: [batchesDir, `${String(spiritItem.workItem.id)}.json`],
        });
        const wardFileArgs = spiritItem.batch.filePaths.join(' ');
        const verificationCommand = `npm run ward -- -- ${wardFileArgs}`;
        const batchContent = JSON.stringify({
          filePaths: spiritItem.batch.filePaths,
          errors: spiritItem.batch.errors,
          verificationCommand,
          contextInstructions,
        });

        return fsWriteFileAdapter({
          filePath: batchFilePath,
          contents: fileContentsContract.parse(batchContent),
        });
      }),
    );
  }

  // Create ward retry that depends on all spiritmender items
  const spiritWorkItems = spiritItems.map((s) => s.workItem);

  const wardRetry = workItemContract.parse({
    id: crypto.randomUUID(),
    role: 'ward',
    status: 'pending',
    spawnerType: 'command',
    dependsOn: spiritWorkItems.map((s) => s.id),
    attempt: workItem.attempt + 1,
    maxAttempts: workItem.maxAttempts,
    createdAt: new Date().toISOString(),
    insertedBy: workItem.id,
    ...(workItem.wardMode ? { wardMode: workItem.wardMode } : {}),
  });

  // Update downstream (siege) to depend on wardRetry instead of this ward
  const replacementMapping = [{ oldId: workItem.id, newId: wardRetry.id }];

  if (questResult.success && questResult.quest) {
    await questWorkItemInsertBroker({
      questId,
      quest: questResult.quest,
      newWorkItems: [...spiritWorkItems, wardRetry],
      replacementMapping: replacementMapping.map((m) => ({
        oldId: m.oldId,
        newId: m.newId,
      })),
    });
  }
  return result;
};
