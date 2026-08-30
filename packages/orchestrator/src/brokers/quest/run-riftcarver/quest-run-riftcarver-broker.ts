/**
 * PURPOSE: Carves the quest's branch, worktree, node_modules and preflight build at the HEAD of the
 * relay, so that minutes-long workspace forge happens when the quest is next in line instead of
 * inside the Start POST. Reach for this over questRunWardBroker for the other command role: ward
 * grades work that already exists and reports one exit code, where this one CREATES the workspace
 * every later role runs in, and so has to route three incompatible failure classes — a repairable
 * red that earns a spiritmender pass, a git-state red that halts rather than dispatch an agent into
 * the repo-root checkout, and a permission wall that halts whichever step surfaced it.
 *
 * ⚠️ THIS BROKER IS RE-ENTERED BY DESIGN. The failure route is riftcarver → spiritmender →
 * riftcarver (pt N), so a second run against a PARTIALLY BUILT workspace is routine, not an edge
 * case. Therefore EVERY step begins with a done-check that inspects the REAL WORLD and skips itself
 * when already satisfied; a step added without one is a bug, not a simplification. Two rules qualify
 * that:
 *
 *   1. A done-check reads DISK, never quest.json alone. A recorded `worktreePath` is a claim, an
 *      accessible directory whose HEAD is still the recorded branch is proof — and the spiritmender
 *      that ran between two attempts may have deleted, moved or repaired things the ledger knows
 *      nothing about. The collision check is skipped on a re-entry for the same reason in reverse:
 *      the branch it would refuse is the quest's OWN, so re-running it locks the quest out forever.
 *   2. THE BUILD IS THE ONE DELIBERATE EXCEPTION and has no done-check, because re-running it IS
 *      how the spiritmender's fix gets verified. The build is the verdict, not a side effect; a
 *      marker file "optimising" it away would let a pt N report green off the previous attempt.
 *
 * `baseRef` is written exactly once, ever: it is read in the same breath as creation and never
 * recomputed, because moving it after commits have landed folds the quest's own work into the review
 * base — the exact defect it exists to fix.
 *
 * `onLine` is REQUIRED. A riftcarver work item is `spawnerType: 'command'` with no sessionId, and
 * the carve is not Claude, so the JSONL watcher can never see it: this callback is the only route
 * its output has to a UI for minutes at a time. See packages/shared/CLAUDE.md → "Streaming
 * Adapters".
 *
 * USAGE:
 * await questRunRiftcarverBroker({ questId, workItemId, onLine: (line) => emit(line) });
 * // Streams the carve live, writes the same text to riftcarver-results/<id>.log, then applies the
 * //   outcome — work-item status, operation completion, the result ref, the work item's back-link
 * //   and any spiritmender + pt N splice — in ONE atomic ledger write, and advances or blocks.
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { locationsWorktreePathFindBroker } from '@dungeonmaster/shared/brokers';
import {
  errorMessageContract,
  exitCodeContract,
  fileContentsContract,
  filePathContract,
  getQuestInputContract,
  operationItemContract,
  riftcarverResultContract,
  workItemContract,
  type ErrorMessage,
  type ModifyQuestInput,
  type Quest,
  type QuestId,
  type QuestWorkItemId,
  type RiftcarverResult,
} from '@dungeonmaster/shared/contracts';
import { isCompleteWorkItemStatusGuard } from '@dungeonmaster/shared/guards';
import { dungeonmasterHomeStatics } from '@dungeonmaster/shared/statics';
import { configDefaultsStatics } from '@dungeonmaster/config';

import { dungeonmasterConfigResolveAdapter } from '../../../adapters/dungeonmaster-config/resolve/dungeonmaster-config-resolve-adapter';
import { fsIsAccessibleAdapter } from '../../../adapters/fs/is-accessible/fs-is-accessible-adapter';
import { gitCurrentBranchAdapter } from '../../../adapters/git/current-branch/git-current-branch-adapter';
import { gitHeadShaAdapter } from '../../../adapters/git/head-sha/git-head-sha-adapter';
import { gitPushAdapter } from '../../../adapters/git/push/git-push-adapter';
import { gitUpstreamShaAdapter } from '../../../adapters/git/upstream-sha/git-upstream-sha-adapter';
import { gitVerifyRefAdapter } from '../../../adapters/git/verify-ref/git-verify-ref-adapter';
import { questRunRiftcarverResultContract } from '../../../contracts/quest-run-riftcarver-result/quest-run-riftcarver-result-contract';
import type { QuestRunRiftcarverResult } from '../../../contracts/quest-run-riftcarver-result/quest-run-riftcarver-result-contract';
import { BaseBranchNotFoundError } from '../../../errors/base-branch-not-found/base-branch-not-found-error';
import { QuestBranchNameTakenError } from '../../../errors/quest-branch-name-taken/quest-branch-name-taken-error';
import { WorktreePrepareError } from '../../../errors/worktree-prepare/worktree-prepare-error';
import { isPermissionDeniedErrorGuard } from '../../../guards/is-permission-denied-error/is-permission-denied-error-guard';
import { slotManagerStatics } from '../../../statics/slot-manager/slot-manager-statics';
import { worktreePrepareStepStatics } from '../../../statics/worktree-prepare-step/worktree-prepare-step-statics';
import { operationPtChainTransformer } from '../../../transformers/operation-pt-chain/operation-pt-chain-transformer';
import { questToGitNamesTransformer } from '../../../transformers/quest-to-git-names/quest-to-git-names-transformer';
import { worktreeFailureDetailTransformer } from '../../../transformers/worktree-failure-detail/worktree-failure-detail-transformer';
import { buildUntilGreenBroker } from '../../build/until-green/build-until-green-broker';
import { gitDetectBaseBranchBroker } from '../../git/detect-base-branch/git-detect-base-branch-broker';
import { riftcarverPersistResultBroker } from '../../riftcarver/persist-result/riftcarver-persist-result-broker';
import { worktreePopulateNodeModulesBroker } from '../../worktree/populate-node-modules/worktree-populate-node-modules-broker';
import { worktreePrepareBroker } from '../../worktree/prepare/worktree-prepare-broker';
import { questAdvanceBroker } from '../advance/quest-advance-broker';
import { questBlockOnFailureBroker } from '../block-on-failure/quest-block-on-failure-broker';
import { questFindQuestPathBroker } from '../find-quest-path/quest-find-quest-path-broker';
import { questGetBroker } from '../get/quest-get-broker';
import { questModifyBroker } from '../modify/quest-modify-broker';
import { questOperationsUpdateBroker } from '../operations-update/quest-operations-update-broker';
import { questRepoRootBroker } from '../repo-root/quest-repo-root-broker';

const STEPS = worktreePrepareStepStatics.steps;
const CLASSIFICATIONS = worktreePrepareStepStatics.classifications;

const GREEN_EXIT_CODE = 0;
const FAILED_EXIT_CODE = 1;

type WorktreePrepareStepValue = (typeof STEPS)[keyof typeof STEPS];

type CarveResult =
  | {
      ok: true;
      branchName: NonNullable<Quest['branchName']>;
      baseBranch: NonNullable<Quest['baseBranch']>;
      worktreePath: NonNullable<Quest['worktreePath']>;
      baseRef: NonNullable<Quest['baseRef']>;
    }
  | { ok: false; failedStep: WorktreePrepareStepValue; error: unknown };

export const questRunRiftcarverBroker = async ({
  questId,
  workItemId,
  onLine,
}: {
  questId: QuestId;
  workItemId: QuestWorkItemId;
  // Required, never optional — see packages/shared/CLAUDE.md, "Streaming Adapters". A riftcarver
  // work item is `spawnerType: 'command'` with no sessionId, so no JSONL watcher can ever see it:
  // this callback is the ONLY route a multi-minute carve's output has to a UI.
  onLine: (line: string) => void;
}): Promise<QuestRunRiftcarverResult> => {
  const { questPath } = await questFindQuestPathBroker({ questId });

  const getResult = await questGetBroker({ input: getQuestInputContract.parse({ questId }) });
  if (!getResult.success || getResult.quest === undefined) {
    throw new Error(`Cannot run riftcarver for quest ${questId}: quest not found`);
  }
  const { quest } = getResult;

  // Mark the work item running BEFORE any spawn. A carve runs for minutes; without this the row
  // reads `pending` the whole time, indistinguishable from "nothing is happening".
  await questModifyBroker({
    input: {
      questId,
      workItems: [{ id: workItemId, status: 'in_progress', startedAt: new Date().toISOString() }],
    } as ModifyQuestInput,
  });

  // One funnel for every line: the live panel and the persisted history file see the same text in
  // the same order, because there is no second path to either.
  const carveLog: ErrorMessage[] = [];
  const stream = {
    emit: (line: string): void => {
      carveLog.push(errorMessageContract.parse(line));
      onLine(line);
    },
  };

  const repoRoot = await questRepoRootBroker({ questId });

  const carve: CarveResult = await (async (): Promise<CarveResult> => {
    const step = { value: STEPS.baseBranch as WorktreePrepareStepValue };

    try {
      // BASE BRANCH. Done-check: the recorded branch still resolves in the repo. The record is a
      // claim; `git rev-parse --verify` is proof, and it costs one cheap probe to re-take.
      step.value = STEPS.baseBranch;
      const recordedBaseBranch = quest.baseBranch;
      const recordedBaseBranchResolves =
        recordedBaseBranch === undefined
          ? false
          : await gitVerifyRefAdapter({ cwd: repoRoot, ref: recordedBaseBranch });
      const detectedBaseBranch = recordedBaseBranchResolves
        ? null
        : await gitDetectBaseBranchBroker({ cwd: repoRoot });
      const baseBranch = recordedBaseBranchResolves ? recordedBaseBranch : detectedBaseBranch;

      if (baseBranch === null || baseBranch === undefined) {
        throw new BaseBranchNotFoundError();
      }

      stream.emit(
        recordedBaseBranchResolves
          ? `— skip base branch: ${baseBranch} already recorded and still resolves —`
          : `— base branch: ${baseBranch} —`,
      );

      // WORKTREE. Done-check reads DISK on both halves: the recorded directory must be reachable
      // AND still have the recorded branch checked out. A recorded path alone proves nothing — the
      // spiritmender that ran between two attempts may have deleted or moved it.
      step.value = STEPS.create;
      const recordedBranchName = quest.branchName;
      const recordedWorktreePath = quest.worktreePath;
      const recordedPathReachable =
        recordedWorktreePath === undefined
          ? false
          : await fsIsAccessibleAdapter({ filePath: filePathContract.parse(recordedWorktreePath) });
      const recordedHead =
        recordedWorktreePath === undefined || !recordedPathReachable
          ? null
          : await gitCurrentBranchAdapter({ cwd: recordedWorktreePath });
      const worktreeAlreadyCarved =
        recordedBranchName !== undefined &&
        recordedHead !== null &&
        recordedHead.exitCode === GREEN_EXIT_CODE &&
        String(recordedHead.output) === String(recordedBranchName);

      const gitNames = questToGitNamesTransformer({ title: quest.title, questId: quest.id });
      const branchName = recordedBranchName ?? gitNames.branchName;
      const worktreePath =
        recordedWorktreePath ??
        locationsWorktreePathFindBroker({ repoRoot, worktreeDirName: gitNames.worktreeDirName });

      stream.emit(
        worktreeAlreadyCarved
          ? `— skip worktree: ${worktreePath} is already a live worktree of ${branchName} —`
          : `— git worktree add ${worktreePath} (branch ${branchName}) —`,
      );

      // The collision check guards the FIRST carve against a name something else already owns. On a
      // re-entry the quest already records the branch — it is OUR branch, so re-running the check
      // would refuse the pt N against work the first attempt did and lock the quest out forever.
      const collision =
        worktreeAlreadyCarved || recordedBranchName !== undefined
          ? null
          : await Promise.all([
              gitVerifyRefAdapter({ cwd: repoRoot, ref: branchName }),
              fsIsAccessibleAdapter({ filePath: filePathContract.parse(worktreePath) }),
            ]);

      if (collision !== null && (collision[0] || collision[1])) {
        throw new QuestBranchNameTakenError({ branchName });
      }

      const created = worktreeAlreadyCarved
        ? null
        : await worktreePrepareBroker({ repoRoot, worktreePath, branchName, baseBranch });

      // BASE REF. Never recomputed once recorded: moving it after commits have landed would fold
      // the quest's own work into the review base, the exact defect `baseRef` exists to fix. The
      // read only happens on a carve that just created the tree, or on the narrow case of a live
      // worktree the ledger never got a sha for.
      const recordedBaseRef = quest.baseRef;
      const carriedBaseRef = recordedBaseRef ?? created?.baseRef;
      const baseRef = carriedBaseRef ?? (await gitHeadShaAdapter({ cwd: worktreePath }));

      if (baseRef === null) {
        throw new WorktreePrepareError({
          step: STEPS.create,
          detail: worktreeFailureDetailTransformer({
            worktreePath,
            cause: 'fork-point sha could not be read',
          }),
        });
      }

      stream.emit(
        recordedBaseRef === undefined
          ? `— baseRef ${baseRef} —`
          : `— skip baseRef: already pinned at ${baseRef} —`,
      );

      // Persist the git context BEFORE node_modules and the build, so a spiritmender dispatched
      // after either of those fails has a worktree to work in and the pt N skips the git steps.
      const gitContextChanged =
        recordedBranchName !== branchName ||
        recordedBaseBranch !== baseBranch ||
        recordedWorktreePath !== worktreePath ||
        recordedBaseRef !== baseRef;

      if (gitContextChanged) {
        await questOperationsUpdateBroker({
          questId,
          update: () => ({ branchName, baseBranch, worktreePath, baseRef }),
        });
      }

      // PUSH. Establishes the branch's upstream, once, right after the git context is recorded.
      // Doing it HERE rather than at the first pass's end is what removes the branching decision
      // from every session downstream: the branch is tracked before the first pass runs, so every
      // `<role>-reviewer` prompt writes a bare `git push` and no session has to decide
      // whether `-u` is needed.
      //
      // Its done-check reads the REAL WORLD like every other step's: a branch that already tracks
      // something has been pushed, whatever the ledger says. Without it a `pt N` carve re-pushes
      // on every retry.
      step.value = STEPS.push;
      const existingUpstream = await gitUpstreamShaAdapter({ cwd: worktreePath });

      if (existingUpstream === null) {
        const pushResult = await gitPushAdapter({ cwd: worktreePath, setUpstream: { branchName } });

        stream.emit(`— git push -u origin ${branchName} —`);

        if (pushResult.exitCode !== 0) {
          throw new WorktreePrepareError({
            step: STEPS.push,
            detail: worktreeFailureDetailTransformer({
              worktreePath,
              cause: String(pushResult.output),
            }),
          });
        }
      } else {
        stream.emit(`— skip push: ${branchName} already tracks an upstream —`);
      }

      // NODE MODULES. Per-root done-checks live inside populateOneRootLayerBroker, which is why
      // they are per ROOT rather than all-or-nothing: an attempt may have mirrored six roots of
      // nine before dying, and a spiritmender may have `npm install`ed one of the rest by hand.
      step.value = STEPS.nodeModules;
      await worktreePopulateNodeModulesBroker({
        repoRoot,
        worktreePath,
        onLine: (line: string): void => {
          stream.emit(line);
        },
      });

      // BUILD. Deliberately has NO done-check — see this file's PURPOSE header.
      step.value = STEPS.build;
      // The config-find chain dirname()s startPath on its first iteration — it expects a FILE, so
      // hand it the repo-root config file itself, NOT the bare repoRoot directory, which would
      // dirname() to the repo root's PARENT and miss the config.
      const configStartPath = filePathContract.parse(
        pathJoinAdapter({ paths: [repoRoot, dungeonmasterHomeStatics.paths.projectConfigFile] }),
      );
      // Absence of a config file (ConfigNotFoundError) is a legitimate "no override" state — fall
      // back to the same default the config contract itself applies. Any other error (malformed
      // JSON, validation, permissions) MUST surface.
      const config = await (async () => {
        try {
          return await dungeonmasterConfigResolveAdapter({ startPath: configStartPath });
        } catch (error: unknown) {
          if (error instanceof Error && error.name === 'ConfigNotFoundError') {
            return null;
          }
          throw error;
        }
      })();
      const buildCommand =
        config?.devServer?.buildCommand ?? configDefaultsStatics.devServer.buildCommand;

      const buildResult = await buildUntilGreenBroker({
        buildCommand,
        cwd: worktreePath,
        onLine: (line: string): void => {
          stream.emit(line);
        },
      });

      if (!buildResult.success) {
        throw new WorktreePrepareError({
          step: STEPS.build,
          detail: worktreeFailureDetailTransformer({
            worktreePath,
            cause: String(buildResult.output),
          }),
        });
      }

      return { ok: true, branchName, baseBranch, worktreePath, baseRef };
    } catch (error: unknown) {
      return { ok: false, failedStep: step.value, error };
    }
  })();

  const failureText = carve.ok
    ? ''
    : carve.error instanceof Error
      ? carve.error.message
      : String(carve.error);

  // Every carve ends on a verdict line, green included. Only the red one used to, which left a
  // green log trailing off on whatever the last package printed — and a first build pass emits
  // hundreds of TS6305 lines before the second one clears, so "ends in errors" is what a GREEN
  // carve looks like to a reader. The outcome then existed only in quest.json.
  if (carve.ok) {
    stream.emit(`— CARVED: ${carve.branchName} at ${carve.baseRef} —`);
  } else {
    stream.emit(`— FAILED at ${carve.failedStep}: ${failureText} —`);
  }

  // A permission wall is checked FIRST and overrides the step's own class: no fresh session of any
  // role can clear an operator's filesystem saying no, so spending a spiritmender pass on it only
  // burns the budget before halting anyway.
  const permissionDenied = carve.ok ? false : isPermissionDeniedErrorGuard({ error: carve.error });
  const repairable =
    !carve.ok && !permissionDenied && CLASSIFICATIONS[carve.failedStep] === 'repairable';
  const failedStep = carve.ok ? undefined : carve.failedStep;
  const exitCode = exitCodeContract.parse(carve.ok ? GREEN_EXIT_CODE : FAILED_EXIT_CODE);

  const riftcarverResultId = crypto.randomUUID();

  await riftcarverPersistResultBroker({
    questFolderPath: filePathContract.parse(questPath),
    riftcarverResultId: riftcarverResultContract.shape.id.parse(riftcarverResultId),
    logContents: fileContentsContract.parse(carveLog.join('\n')),
  });

  const completedAt = new Date().toISOString();
  const routed = { outcome: 'blocked' as RiftcarverResult['outcome'] };

  // ONE atomic write: the work item's terminal status, the riftcarver operation item completing,
  // the riftcarverResults ref, the work item's back-link to it, and (on a repairable red with
  // budget left) the spiritmender + fresh-carve splice. All-or-nothing on crash.
  await questOperationsUpdateBroker({
    questId,
    update: ({ quest: current }) => {
      // Bound the repair loop: count the riftcarver operation items since the last GREEN riftcarver
      // (a carve op is green when its linked riftcarver work item completed).
      const carveOps = current.operations.filter((operation) => operation.role === 'riftcarver');
      const lastGreenIndex = carveOps.reduce(
        (acc, operation, index) =>
          current.workItems.some(
            (item) =>
              item.relatedDataItems.some(
                (ref) => String(ref) === `operations/${String(operation.id)}`,
              ) &&
              item.role === 'riftcarver' &&
              isCompleteWorkItemStatusGuard({ status: item.status }),
          )
            ? index
            : acc,
        -1,
      );
      const redChainLength = carveOps.length - (lastGreenIndex + 1);
      const budgetLeft = redChainLength < slotManagerStatics.riftcarver.maxRetries;

      routed.outcome = carve.ok ? 'green' : repairable && budgetLeft ? 'repairable' : 'blocked';

      const riftcarverResult = riftcarverResultContract.parse({
        id: riftcarverResultId,
        createdAt: completedAt,
        exitCode,
        ...(failedStep === undefined ? {} : { failedStep }),
        outcome: routed.outcome,
      });
      const nextRiftcarverResults = [...current.riftcarverResults, riftcarverResult];

      const carveWorkItem = current.workItems.find((item) => item.id === workItemId);
      if (carveWorkItem === undefined) {
        return { riftcarverResults: nextRiftcarverResults };
      }

      const nextWorkItems = current.workItems.map((item) =>
        item.id === workItemId
          ? workItemContract.parse({
              ...item,
              status: carve.ok ? 'complete' : 'failed',
              completedAt,
              // The execution panel resolves a row's carve log ONLY through a
              // `riftcarverResults/<id>` ref — this back-link is the whole route to the detail.
              relatedDataItems: [
                ...item.relatedDataItems.map((ref) => String(ref)),
                `riftcarverResults/${String(riftcarverResult.id)}`,
              ],
              ...(carve.ok
                ? {}
                : {
                    // A repairable red hands a spiritmender a machine-readable step name; a
                    // git-state or permission red hands the USER git's own words, because nothing
                    // downstream can act on it and the row is where they read it.
                    errorMessage: repairable
                      ? `riftcarver_${String(failedStep)}_failed`
                      : failureText,
                  }),
            })
          : item,
      );

      const linkedRef = carveWorkItem.relatedDataItems
        .map((ref) => String(ref))
        .find((ref) => ref.startsWith('operations/'));
      const linkedOperation = current.operations.find(
        (operation) => String(operation.id) === (linkedRef?.split('/')[1] ?? ''),
      );
      if (linkedOperation === undefined) {
        return { workItems: nextWorkItems, riftcarverResults: nextRiftcarverResults };
      }

      const completedOperations = current.operations.map((operation) =>
        operation.id === linkedOperation.id
          ? operationItemContract.parse({ ...operation, status: 'complete' })
          : operation,
      );

      if (routed.outcome !== 'repairable') {
        return {
          operations: completedOperations,
          workItems: nextWorkItems,
          riftcarverResults: nextRiftcarverResults,
        };
      }

      const spiritmenderOp = operationItemContract.parse({
        id: crypto.randomUUID(),
        role: 'spiritmender',
        // The failing step AND the result id ride the text: operationPtChainTransformer keys a
        // chain on role + base text, so naming this attempt is what buys it its own pt budget
        // instead of sharing one with every other repair on the quest.
        text: `Spiritmender: fix riftcarver ${String(failedStep)} failure — riftcarverResult ${riftcarverResultId}`,
        status: 'pending',
        locked: true,
      });

      const { base, chainLength } = operationPtChainTransformer({
        operations: current.operations,
        item: linkedOperation,
      });
      const freshCarveOp = operationItemContract.parse({
        id: crypto.randomUUID(),
        role: 'riftcarver',
        text: `pt ${String(chainLength + 1)}: ${base}`,
        status: 'pending',
        locked: true,
        flowIds: linkedOperation.flowIds,
        packageNames: linkedOperation.packageNames,
      });

      const insertIndex =
        completedOperations.findIndex((operation) => operation.id === linkedOperation.id) + 1;

      return {
        operations: [
          ...completedOperations.slice(0, insertIndex),
          spiritmenderOp,
          freshCarveOp,
          ...completedOperations.slice(insertIndex),
        ],
        workItems: nextWorkItems,
        riftcarverResults: nextRiftcarverResults,
      };
    },
  });

  if (routed.outcome === 'blocked') {
    await questBlockOnFailureBroker({ questId, failedWorkItemId: workItemId });
  } else {
    await questAdvanceBroker({ questId });
  }

  return questRunRiftcarverResultContract.parse({
    success: true,
    questId,
    workItemId,
    exitCode,
    riftcarverResultId,
    outcome: routed.outcome,
    ...(failedStep === undefined ? {} : { failedStep }),
  });
};
