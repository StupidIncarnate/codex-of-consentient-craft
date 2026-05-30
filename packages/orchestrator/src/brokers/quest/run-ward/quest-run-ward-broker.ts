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
  exitCodeContract,
  fileContentsContract,
  fileNameContract,
  filePathContract,
  wardResultContract,
  type QuestId,
  type QuestWorkItemId,
} from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import type { ModifyQuestInput } from '@dungeonmaster/shared/contracts';

import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import { questRunWardResultContract } from '../../../contracts/quest-run-ward-result/quest-run-ward-result-contract';
import type { QuestRunWardResult } from '../../../contracts/quest-run-ward-result/quest-run-ward-result-contract';
import { wardOutputToRunIdTransformer } from '../../../transformers/ward-output-to-run-id/ward-output-to-run-id-transformer';
import { wardDetailBroker } from '../../ward/detail/ward-detail-broker';
import { questFindQuestPathBroker } from '../find-quest-path/quest-find-quest-path-broker';
import { questModifyBroker } from '../modify/quest-modify-broker';

const WARD_COMMAND = 'dungeonmaster-ward';

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

  return questRunWardResultContract.parse({
    success: true,
    questId,
    workItemId,
    exitCode,
    wardResultId: wardResult.id,
    ...(lastWardRunId === undefined ? {} : { lastWardRunId }),
  });
};
