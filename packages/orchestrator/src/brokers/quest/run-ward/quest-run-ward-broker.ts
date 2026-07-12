/**
 * PURPOSE: MCP-driven entry point that runs ward synchronously for one work item and persists the result onto the quest's work item
 *
 * USAGE:
 * const result = await questRunWardBroker({ questId, workItemId, mode: 'changed' });
 * // Spawns ward, persists the trimmed detail blob under quest-folder/ward-results/,
 * //   appends a lightweight WardResult ref to quest.wardResults, stamps lastWardRunId
 * //   on the work item, marks the work item complete (exit 0) or failed (non-zero),
 * //   and returns { success, exitCode, wardResultId, lastWardRunId? }.
 *
 * WHEN-TO-USE: Called by the run-ward MCP tool when /dumpster-launch dispatches a `run-ward` step.
 * WHEN-NOT-TO-USE: From the existing orchestration loop — that path keeps using runWardLayerBroker
 *   (which also drives the spiritmender retry chain). The MCP path delegates retry/recovery to the
 *   orchestrator LLM via subsequent get-next-step calls.
 */

import {
  childProcessSpawnStreamLinesAdapter,
  fsMkdirAdapter,
  pathJoinAdapter,
  processCwdAdapter,
} from '@dungeonmaster/shared/adapters';
import {
  absoluteFilePathContract,
  errorMessageContract,
  exitCodeContract,
  fileContentsContract,
  fileNameContract,
  filePathContract,
  getQuestInputContract,
  wardResultContract,
  workItemContract,
  type QuestId,
  type QuestWorkItemId,
} from '@dungeonmaster/shared/contracts';
import { isCompleteWorkItemStatusGuard } from '@dungeonmaster/shared/guards';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import type { ModifyQuestInput } from '@dungeonmaster/shared/contracts';

import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import { questRunWardResultContract } from '../../../contracts/quest-run-ward-result/quest-run-ward-result-contract';
import type { QuestRunWardResult } from '../../../contracts/quest-run-ward-result/quest-run-ward-result-contract';
import type { SpiritmenderBatch } from '../../../contracts/spiritmender-batch/spiritmender-batch-contract';
import { slotManagerStatics } from '../../../statics/slot-manager/slot-manager-statics';
import { spiritmenderContextStatics } from '../../../statics/spiritmender-context/spiritmender-context-statics';
import { wardDetailToSpiritmenderBatchesTransformer } from '../../../transformers/ward-detail-to-spiritmender-batches/ward-detail-to-spiritmender-batches-transformer';
import { wardOutputToRunIdTransformer } from '../../../transformers/ward-output-to-run-id/ward-output-to-run-id-transformer';
import { wardDetailBroker } from '../../ward/detail/ward-detail-broker';
import { questFindQuestPathBroker } from '../find-quest-path/quest-find-quest-path-broker';
import { questGetBroker } from '../get/quest-get-broker';
import { questModifyBroker } from '../modify/quest-modify-broker';
import { questSpliceFixerBroker } from '../splice-fixer/quest-splice-fixer-broker';
import { questSplicePathseekerReplanBroker } from '../splice-pathseeker-replan/quest-splice-pathseeker-replan-broker';

const WARD_COMMAND = 'dungeonmaster-ward';
const SPIRITMENDER_BATCHES_DIR = 'spiritmender-batches';

export const questRunWardBroker = async ({
  questId,
  workItemId,
  mode,
}: {
  questId: QuestId;
  workItemId: QuestWorkItemId;
  mode: 'changed' | 'full';
}): Promise<QuestRunWardResult> => {
  const startPath = absoluteFilePathContract.parse(processCwdAdapter());

  const { questPath } = await questFindQuestPathBroker({ questId });

  // 1. Spawn ward and stream stdout (no callback — the JSONL watcher owns live UI streaming
  //    in the new model). Keep the same arg shape spawn-ward-layer-broker uses so behavior
  //    matches the existing orchestration-loop path.
  const args = mode === 'changed' ? ['run', '--changed'] : ['run'];

  const { exitCode: rawExitCode, output } = await childProcessSpawnStreamLinesAdapter({
    command: process.env.WARD_CLI_PATH ?? WARD_COMMAND,
    args,
    cwd: startPath,
  });

  const exitCode = rawExitCode ?? exitCodeContract.parse(1);
  const runId = wardOutputToRunIdTransformer({ output });

  // 2. Capture and persist the detail blob (best effort — ward may exit without a runId on crash).
  const detailJson = runId ? await wardDetailBroker({ startPath, runId }) : null;

  const wardResultId = crypto.randomUUID();

  if (detailJson) {
    const wardResultsDir = pathJoinAdapter({
      paths: [questPath, locationsStatics.quest.wardResultsDir],
    });
    await fsMkdirAdapter({ filepath: wardResultsDir });
    const detailFilePath = filePathContract.parse(
      pathJoinAdapter({ paths: [wardResultsDir, `${wardResultId}.json`] }),
    );
    await fsWriteFileAdapter({
      filePath: detailFilePath,
      contents: fileContentsContract.parse(detailJson),
    });
  }

  // 3. Append the lightweight ref to quest.wardResults and mark the work item terminal.
  const wardResult = wardResultContract.parse({
    id: wardResultId,
    createdAt: new Date().toISOString(),
    exitCode,
    ...(runId ? { runId: String(runId) } : {}),
    wardMode: mode,
  });

  const wardResultsModifyResult = await questModifyBroker({
    input: {
      questId,
      wardResults: [wardResult],
    } as ModifyQuestInput,
  });
  if (!wardResultsModifyResult.success) {
    throw new Error(
      `Failed to persist ward result for quest ${questId}: ${wardResultsModifyResult.error ?? 'unknown'}`,
    );
  }

  const lastWardRunId = runId === null ? undefined : fileNameContract.parse(String(runId));

  const completedAt = new Date().toISOString();
  const status = exitCode === 0 ? 'complete' : 'failed';

  const workItemModifyResult = await questModifyBroker({
    input: {
      questId,
      workItems: [
        {
          id: workItemId,
          status,
          completedAt,
          // Link the wardResult back to the work item — the execution panel resolves a row's
          // ward results ONLY through relatedDataItems `wardResults/<id>` refs. Without this the
          // [WARD] row renders status + error but never the exit code / detail breakdown.
          relatedDataItems: [`wardResults/${wardResult.id}`],
          ...(lastWardRunId === undefined ? {} : { lastWardRunId }),
          ...(status === 'failed' ? { errorMessage: 'ward_failed' } : {}),
        },
      ],
    } as ModifyQuestInput,
  });
  if (!workItemModifyResult.success) {
    throw new Error(
      `Failed to persist ward work item update for quest ${questId}: ${workItemModifyResult.error ?? 'unknown'}`,
    );
  }

  // Ward passed — nothing to recover. The MCP response is built below unchanged.
  if (exitCode !== 0) {
    // Ward failed — route recovery. Load the quest fresh so we can read the failed ward work
    // item's retry budget + wardMode and detect a prior Blightwarden pass.
    const questInput = getQuestInputContract.parse({ questId });
    const failureGetResult = await questGetBroker({ input: questInput });

    if (failureGetResult.success && failureGetResult.quest !== undefined) {
      const { quest } = failureGetResult;
      const wardWorkItem = quest.workItems.find((item) => item.id === workItemId);

      if (wardWorkItem !== undefined) {
        if (wardWorkItem.attempt >= wardWorkItem.maxAttempts - 1) {
          // Retries exhausted — the build could not be made green after every spiritmender pass, so
          // the plan is a hole. Escalate to a PathSeeker replan (recovery-first, never an immediate
          // block); it blocks only once the replan loop itself is spent.
          const replanBrief = workItemContract.shape.summary.parse(
            `ward ${mode} could not pass after ${String(wardWorkItem.maxAttempts)} attempts and every spiritmender fix — re-plan the affected slice.`,
          );
          await questSplicePathseekerReplanBroker({
            questId,
            failedWorkItemId: workItemId,
            brief: replanBrief,
          });
        } else {
          // Retry budget remains — splice batched spiritmenders + a ward retry.
          const detailBatches = detailJson
            ? wardDetailToSpiritmenderBatchesTransformer({
                detailJson: errorMessageContract.parse(detailJson),
                batchSize: slotManagerStatics.ward.spiritmenderBatchSize,
              })
            : [];

          // Invariant: a failed ward with retry budget ALWAYS splices at least one spiritmender,
          // so the ward-retry never depends on an empty set (which would make it immediately ready
          // and let ward re-run with nothing repaired). When the detail blob yields no batches
          // (ward crashed before emitting a runId, or produced no parseable failure detail), fall
          // back to a single catch-all spiritmender carrying the failure summary.
          const batches: SpiritmenderBatch[] =
            detailBatches.length > 0
              ? detailBatches
              : [
                  {
                    filePaths: [],
                    errors: [
                      errorMessageContract.parse(
                        `ward ${mode} failed (exit ${String(exitCode)}) with no structured errors — re-run ward and fix every reported failure`,
                      ),
                    ],
                  },
                ];

          // Pick the context preamble: post-Blightwarden warning if Blightwarden already ran,
          // else the default ward-failure preamble.
          const blightwardenRan = quest.workItems.some(
            (item) =>
              item.role === 'blightwarden' &&
              isCompleteWorkItemStatusGuard({ status: item.status }),
          );
          const contextInstructions = blightwardenRan
            ? spiritmenderContextStatics.postBlightwardenFailure.instructions
            : spiritmenderContextStatics.wardFailure.instructions;

          // Build one spiritmender work item per batch, keyed so its sidecar matches.
          const createdAt = new Date().toISOString();
          const spiritmenderItems = batches.map(() =>
            workItemContract.parse({
              id: crypto.randomUUID(),
              role: 'spiritmender',
              status: 'pending',
              spawnerType: 'agent',
              dependsOn: [workItemId],
              maxAttempts: 1,
              createdAt,
              insertedBy: workItemId,
            }),
          );

          // Write the sidecar batch file for each spiritmender. PATH + SHAPE are a pinned
          // contract shared with agentPromptGetBroker (reader) and the lawbringer signal-back
          // writer. Resolve <questDir> the same way the ward-results dir is resolved above.
          if (spiritmenderItems.length > 0) {
            const batchesDir = pathJoinAdapter({
              paths: [questPath, SPIRITMENDER_BATCHES_DIR],
            });
            await fsMkdirAdapter({ filepath: batchesDir });

            await Promise.all(
              spiritmenderItems.map(async (spiritmenderItem, index) => {
                const batch = batches[index];
                const filePaths = batch ? batch.filePaths : [];
                const errors = batch ? batch.errors : [];
                const batchFilePath = filePathContract.parse(
                  pathJoinAdapter({
                    paths: [batchesDir, `${String(spiritmenderItem.id)}.json`],
                  }),
                );
                const verificationCommand = `npm run ward -- -- ${filePaths.join(' ')}`;
                const batchContents = JSON.stringify({
                  filePaths,
                  errors,
                  verificationCommand,
                  contextInstructions,
                });

                return fsWriteFileAdapter({
                  filePath: batchFilePath,
                  contents: fileContentsContract.parse(batchContents),
                });
              }),
            );
          }

          // One ward-retry item depending on all spiritmenders, same wardMode as the failed ward.
          const wardRetryItem = workItemContract.parse({
            id: crypto.randomUUID(),
            role: 'ward',
            status: 'pending',
            spawnerType: 'command',
            dependsOn: spiritmenderItems.map((item) => item.id),
            attempt: wardWorkItem.attempt + 1,
            maxAttempts: wardWorkItem.maxAttempts,
            createdAt,
            insertedBy: workItemId,
            ...(wardWorkItem.wardMode ? { wardMode: wardWorkItem.wardMode } : {}),
          });

          await questSpliceFixerBroker({
            questId,
            quest,
            failedWorkItemId: workItemId,
            fixerItems: spiritmenderItems,
            retryItem: wardRetryItem,
          });
        }
      }
    }
  }

  return questRunWardResultContract.parse({
    success: true,
    questId,
    workItemId,
    exitCode,
    wardResultId: wardResult.id,
    ...(lastWardRunId === undefined ? {} : { lastWardRunId }),
  });
};
