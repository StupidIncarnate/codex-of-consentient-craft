/**
 * PURPOSE: Runs ward synchronously for one ward work item and applies the outcome to the
 * operations ledger. Ward is a first-class operation item: GREEN marks the linked ward operation
 * item complete and advances to the next item; RED marks it complete too, then appends a
 * spiritmender operation item plus a fresh ward continuation ("pt N", same wardMode) AFTER it —
 * so the next dispatched item is the spiritmender (never another ward back-to-back), and the
 * fresh ward re-verifies after the fix. The red chain is bounded: once the ward items of this
 * wardMode since the last green ward of the same mode reach `slotManagerStatics.ward.maxRetries`,
 * the quest blocks instead of appending another fix loop.
 *
 * USAGE:
 * const result = await questRunWardBroker({ questId, workItemId, mode: 'changed' });
 * // Spawns ward, persists the trimmed detail blob under quest-folder/ward-results/, appends a
 * //   WardResult ref to quest.wardResults, atomically applies work-item terminal status +
 * //   ledger mutation, calls advance, and returns { success, exitCode, wardResultId }.
 *
 * WHEN-TO-USE: Called by the run-ward MCP tool / Node dispatch loop when a `run-ward` step
 *   dispatches. This broker owns the ONLY failure concept in the orchestrator (ward exit-code
 *   red) — agent roles have no failure signal.
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
  operationItemContract,
  wardResultContract,
  workItemContract,
  type ModifyQuestInput,
  type QuestId,
  type QuestWorkItemId,
} from '@dungeonmaster/shared/contracts';
import { isCompleteWorkItemStatusGuard } from '@dungeonmaster/shared/guards';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import { questRunWardResultContract } from '../../../contracts/quest-run-ward-result/quest-run-ward-result-contract';
import type { QuestRunWardResult } from '../../../contracts/quest-run-ward-result/quest-run-ward-result-contract';
import { slotManagerStatics } from '../../../statics/slot-manager/slot-manager-statics';
import { operationPtChainTransformer } from '../../../transformers/operation-pt-chain/operation-pt-chain-transformer';
import { wardOutputToRunIdTransformer } from '../../../transformers/ward-output-to-run-id/ward-output-to-run-id-transformer';
import { wardDetailBroker } from '../../ward/detail/ward-detail-broker';
import { questAdvanceBroker } from '../advance/quest-advance-broker';
import { questBlockOnFailureBroker } from '../block-on-failure/quest-block-on-failure-broker';
import { questFindQuestPathBroker } from '../find-quest-path/quest-find-quest-path-broker';
import { questModifyBroker } from '../modify/quest-modify-broker';
import { questOperationsUpdateBroker } from '../operations-update/quest-operations-update-broker';

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

  // 1. Spawn ward and stream stdout (no callback — the JSONL watcher owns live UI streaming).
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

  // 3. Append the lightweight ref to quest.wardResults.
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
  const green = exitCode === 0;

  // 4. ONE atomic ledger + work-item write: terminal work-item status, ward operation item
  //    complete, and (on red, budget permitting) the spiritmender + fresh-ward continuation.
  const blockedOnSpentWardChain = { value: false };

  await questOperationsUpdateBroker({
    questId,
    update: ({ quest }) => {
      const wardWorkItem = quest.workItems.find((item) => item.id === workItemId);
      if (wardWorkItem === undefined) {
        return null;
      }

      const nextWorkItems = quest.workItems.map((item) =>
        item.id === workItemId
          ? workItemContract.parse({
              ...item,
              status: green ? 'complete' : 'failed',
              completedAt,
              // Link the wardResult back to the work item — the execution panel resolves a
              // row's ward results ONLY through relatedDataItems `wardResults/<id>` refs.
              relatedDataItems: [
                ...item.relatedDataItems.map((ref) => String(ref)),
                `wardResults/${String(wardResult.id)}`,
              ],
              ...(lastWardRunId === undefined ? {} : { lastWardRunId }),
              ...(green ? {} : { errorMessage: 'ward_failed' }),
            })
          : item,
      );

      const linkedRef = wardWorkItem.relatedDataItems
        .map((ref) => String(ref))
        .find((ref) => ref.startsWith('operations/'));
      const linkedOperation = quest.operations.find(
        (operation) => String(operation.id) === (linkedRef?.split('/')[1] ?? ''),
      );
      if (linkedOperation === undefined) {
        return { workItems: nextWorkItems };
      }

      const completedOperations = quest.operations.map((operation) =>
        operation.id === linkedOperation.id
          ? operationItemContract.parse({ ...operation, status: 'complete' })
          : operation,
      );

      if (green) {
        return { operations: completedOperations, workItems: nextWorkItems };
      }

      // RED — bound the fix loop: count the ward operation items of this wardMode since the
      // last GREEN ward of the same mode (a ward op is green when its linked ward work item
      // completed). Reaching the budget blocks instead of appending another spiritmender+ward.
      const sameModeWardOps = quest.operations.filter(
        (operation) => operation.role === 'ward' && operation.wardMode === mode,
      );
      const lastGreenIndex = sameModeWardOps.reduce(
        (acc, operation, index) =>
          quest.workItems.some(
            (item) =>
              item.relatedDataItems.some(
                (ref) => String(ref) === `operations/${String(operation.id)}`,
              ) &&
              item.role === 'ward' &&
              isCompleteWorkItemStatusGuard({ status: item.status }),
          )
            ? index
            : acc,
        -1,
      );
      const redChainLength = sameModeWardOps.length - (lastGreenIndex + 1);

      if (redChainLength >= slotManagerStatics.ward.maxRetries) {
        blockedOnSpentWardChain.value = true;
        return { operations: completedOperations, workItems: nextWorkItems };
      }

      const spiritmenderOp = operationItemContract.parse({
        id: crypto.randomUUID(),
        role: 'spiritmender',
        text: `Spiritmender: fix ward (${mode}) failures — wardResult ${wardResultId}`,
        status: 'pending',
        locked: true,
      });

      const { base, chainLength } = operationPtChainTransformer({
        operations: quest.operations,
        item: linkedOperation,
      });
      const freshWardOp = operationItemContract.parse({
        id: crypto.randomUUID(),
        role: 'ward',
        text: `pt ${String(chainLength + 1)}: ${base}`,
        status: 'pending',
        locked: true,
        wardMode: mode,
      });

      const insertIndex =
        completedOperations.findIndex((operation) => operation.id === linkedOperation.id) + 1;
      const withRecovery = [
        ...completedOperations.slice(0, insertIndex),
        spiritmenderOp,
        freshWardOp,
        ...completedOperations.slice(insertIndex),
      ];

      return { operations: withRecovery, workItems: nextWorkItems };
    },
  });

  if (blockedOnSpentWardChain.value) {
    await questBlockOnFailureBroker({ questId, failedWorkItemId: workItemId });
  } else {
    await questAdvanceBroker({ questId });
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
