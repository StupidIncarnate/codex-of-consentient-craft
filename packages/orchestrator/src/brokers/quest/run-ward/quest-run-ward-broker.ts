/**
 * PURPOSE: Runs ward synchronously for one ward work item and applies the outcome to the
 * operations ledger. Ward is a first-class operation item: GREEN marks the linked ward operation
 * item complete and advances to the next item; RED marks it complete too, then appends a
 * spiritmender operation item plus a fresh ward continuation ("pt N", same wardMode) AFTER it —
 * so the next dispatched item is the spiritmender (never another ward back-to-back), and the
 * fresh ward re-verifies after the fix. The red chain is bounded: once the ward items of this
 * wardMode since the last green ward of the same mode reach `slotManagerStatics.ward.maxRetries`,
 * the quest blocks instead of appending another fix loop. A CRASH exit
 * (`wardExitCodeStatics.exitCodes.crash` — ward could not run a check at all) skips the fix loop
 * entirely and blocks immediately: there is no failing file to hand a spiritmender.
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
 *
 * `onLine` is REQUIRED. Ward is the one work item nothing else can stream: the JSONL watcher keys
 * on `workItems[].sessionId` and tails Claude session JSONL, but a ward work item is
 * `spawnerType: 'command'` with no sessionId, and ward is not Claude — it never writes a JSONL.
 * This callback is therefore the ONLY route ward output has to a UI, for minutes at a time. Callers
 * with genuinely nowhere to send it pass `() => undefined` explicitly. See
 * `packages/shared/CLAUDE.md` → "Streaming Adapters".
 *
 * Ward runs inside the quest's own worktree (or the legacy repo root for a quest recorded before
 * worktrees existed) — the same tree its changed-file set has to describe, since a `--changed`
 * run diffs against the quest's `baseRef` inside that tree.
 */

import {
  childProcessSpawnStreamLinesAdapter,
  fsMkdirAdapter,
  pathJoinAdapter,
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
import { locationsStatics, wardExitCodeStatics } from '@dungeonmaster/shared/statics';

import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import { questRunWardResultContract } from '../../../contracts/quest-run-ward-result/quest-run-ward-result-contract';
import type { QuestRunWardResult } from '../../../contracts/quest-run-ward-result/quest-run-ward-result-contract';
import { runWardRefusalStatics } from '../../../statics/run-ward-refusal/run-ward-refusal-statics';
import { slotManagerStatics } from '../../../statics/slot-manager/slot-manager-statics';
import { operationPtChainTransformer } from '../../../transformers/operation-pt-chain/operation-pt-chain-transformer';
import { wardOutputToRunIdTransformer } from '../../../transformers/ward-output-to-run-id/ward-output-to-run-id-transformer';
import { wardDetailBroker } from '../../ward/detail/ward-detail-broker';
import { questAdvanceBroker } from '../advance/quest-advance-broker';
import { questBlockOnFailureBroker } from '../block-on-failure/quest-block-on-failure-broker';
import { questCwdResolveBroker } from '../cwd-resolve/quest-cwd-resolve-broker';
import { questFindQuestPathBroker } from '../find-quest-path/quest-find-quest-path-broker';
import { questLoadBroker } from '../load/quest-load-broker';
import { questModifyBroker } from '../modify/quest-modify-broker';
import { questOperationsUpdateBroker } from '../operations-update/quest-operations-update-broker';

const WARD_COMMAND = 'dungeonmaster-ward';

export const questRunWardBroker = async ({
  questId,
  workItemId,
  mode,
  onLine,
}: {
  questId: QuestId;
  workItemId: QuestWorkItemId;
  mode: 'changed' | 'full';
  onLine: (line: string) => void;
}): Promise<QuestRunWardResult> => {
  // Resolve the quest's cwd BEFORE any spawn or stamp. A quest whose recorded worktree is
  // missing is a guard, not a routine path — the dispatch scan blocks the quest before ward is
  // ever selected for it, so reaching this branch means something removed the worktree out from
  // under an already-dispatched item.
  const resolution = await questCwdResolveBroker({ questId });
  if (resolution.kind === 'missing-worktree') {
    throw new Error(
      `Cannot run ward for quest ${questId}: worktree not found: ${resolution.worktreePath}`,
    );
  }
  const startPath = absoluteFilePathContract.parse(resolution.cwd);

  const { questPath } = await questFindQuestPathBroker({ questId });

  // 0. GATE — everything below applies ward's verdict to whatever work item this call NAMES: the
  //    stamp at step 1 resets `startedAt`, and step 5 writes a terminal status plus `ward_failed` /
  //    `ward_crashed`. Both dispatchers only ever name a `ward` item, so a call naming any other
  //    role came from an agent that reached for the MCP tool by hand — a worker minion capturing
  //    red-phase evidence passes its PARENT's workItemId, and a red run then marks a session that
  //    is still running `failed`, splices a spiritmender behind it, and answers the session's later
  //    `signal-back` with `{success: true}` onto an already-failed item. The refusal THROWS so the
  //    message rides back to that agent instead of being swallowed.
  //
  //    `role === 'ward'` and NOT `isCommandWorkItemRoleGuard`: the command set also holds
  //    `riftcarver`, whose item this broker would corrupt in exactly the same way.
  //
  //    A workItemId that is on no work item at all is NOT refused — the ward run still records its
  //    result on the quest, which is the pre-existing "ward work item missing" behaviour.
  const questFilePath = filePathContract.parse(
    pathJoinAdapter({ paths: [questPath, locationsStatics.quest.questFile] }),
  );
  const targetWorkItem = (await questLoadBroker({ questFilePath })).workItems.find(
    (item) => item.id === workItemId,
  );
  if (targetWorkItem !== undefined && targetWorkItem.role !== runWardRefusalStatics.requiredRole) {
    throw new Error(
      runWardRefusalStatics.messageTemplate
        .replace('$WORK_ITEM_ID', () => String(workItemId))
        .replace('$QUEST_ID', () => String(questId))
        .replace('$ROLE', () => targetWorkItem.role),
    );
  }

  // 1. Mark the work item running BEFORE spawning. Ward can run for minutes; without this the row
  //    reads `pending` the whole time, indistinguishable from "nothing is happening". The agent
  //    path does the same in spawnBatchLayerBroker.
  await questModifyBroker({
    input: {
      questId,
      workItems: [{ id: workItemId, status: 'in_progress', startedAt: new Date().toISOString() }],
    } as ModifyQuestInput,
  });

  // 2. Spawn ward, streaming each stdout/stderr line to the caller as it arrives.
  const args = mode === 'changed' ? ['run', '--changed'] : ['run'];

  const { exitCode: rawExitCode, output } = await childProcessSpawnStreamLinesAdapter({
    command: process.env.WARD_CLI_PATH ?? WARD_COMMAND,
    args,
    cwd: startPath,
    onLine,
  });

  const exitCode = rawExitCode ?? exitCodeContract.parse(wardExitCodeStatics.exitCodes.failing);
  const runId = wardOutputToRunIdTransformer({ output });

  // 3. Capture and persist the detail blob (best effort — ward may exit without a runId on crash).
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

  // 4. Append the lightweight ref to quest.wardResults.
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
  const green = exitCode === wardExitCodeStatics.exitCodes.pass;
  // Ward could not run a check at all (a child ward died, a tool crashed) — there is no failing
  // file for a spiritmender to fix, so this halts the quest instead of spending the retry budget.
  const crashed = exitCode === wardExitCodeStatics.exitCodes.crash;

  // 5. ONE atomic ledger + work-item write: terminal work-item status, ward operation item
  //    complete, and (on red, budget permitting) the spiritmender + fresh-ward continuation.
  const blockedOnSpentWardChain = { value: false };
  const blockedOnWardCrash = { value: false };

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
              ...(green ? {} : { errorMessage: crashed ? 'ward_crashed' : 'ward_failed' }),
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

      // CRASH — ward never reported on the code. A spiritmender has nothing to fix and the next
      // ward would crash the same way, so block for the user instead of appending a fix loop.
      if (crashed) {
        blockedOnWardCrash.value = true;
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
      // `flowIds` AND `packageNames` ride along: they are the completed ward item's declared scope,
      // and a continuation that drops either re-verifies something wider (or narrower) than the run
      // it is replacing.
      const freshWardOp = operationItemContract.parse({
        id: crypto.randomUUID(),
        role: 'ward',
        text: `pt ${String(chainLength + 1)}: ${base}`,
        status: 'pending',
        locked: true,
        flowIds: linkedOperation.flowIds,
        packageNames: linkedOperation.packageNames,
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

  if (blockedOnSpentWardChain.value || blockedOnWardCrash.value) {
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
