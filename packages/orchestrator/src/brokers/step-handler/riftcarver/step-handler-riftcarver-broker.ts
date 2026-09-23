/**
 * PURPOSE: Carves the quest's branch, worktree, node_modules mirror and preflight typecheck, and
 * classifies the result. Runs the whole carve pipeline (every
 * done-check, the base-ref pin, the carve-time push, the provision call, the typecheck) — that IS
 * the "run code" job, not routing. It writes no terminal work-item status and completes no
 * operation item: a repairable red's `unmet` routes to a fresh `repair` step (a spiritmender pass),
 * which returns to the `carve` step that minted it — that decision belongs to the router (story 15),
 * never this handler. The `riftcarverResults` ref append is kept — same reasoning as ward's
 * `wardResults` append — because persisting THIS handler's own result record is its job, not the
 * router's.
 *
 * `args` rides the signature for symmetry with the other three handlers; riftcarver takes none
 * today (`agentFlowStatics.riftcarver.steps.carve.args` is `[]`) and this handler never reads it.
 *
 * `workItemId` rides the signature the same way and is never read either — the terminal work-item
 * write it would have justified is routing, which the router owns now.
 *
 * Failure classification is `riftcarverFailureClassifyTransformer`'s job: `unmet` for a repairable
 * red (push / node_modules / typecheck), `wall` for a git-state red (create / base_branch /
 * seed-dist / verify-links) or a permission denial at ANY step — this is the ONE deterministic
 * step that can wall on its own classification, because a git-state red genuinely has no worktree
 * to send a repair into.
 *
 * USAGE:
 * const result = await stepHandlerRiftcarverBroker({ args: [], questId, workItemId, onLine });
 * // { outcome: 'done' | 'unmet' | 'wall', detail, resultRef: 'riftcarverResults/<id>' }
 */

import { childProcessSpawnStreamLinesAdapter } from '@dungeonmaster/shared/adapters';
import { locationsWorktreePathFindBroker } from '@dungeonmaster/shared/brokers';
import {
  contentTextContract,
  errorMessageContract,
  exitCodeContract,
  fileContentsContract,
  filePathContract,
  getQuestInputContract,
  relatedDataItemContract,
  riftcarverResultContract,
  type AbsoluteFilePath,
  type BaseBranchName,
  type ErrorMessage,
  type Quest,
  type QuestBranchName,
  type QuestId,
  type QuestWorkItemId,
} from '@dungeonmaster/shared/contracts';

import { fsIsAccessibleAdapter } from '../../../adapters/fs/is-accessible/fs-is-accessible-adapter';
import { gitCurrentBranchAdapter } from '../../../adapters/git/current-branch/git-current-branch-adapter';
import { gitHeadShaAdapter } from '../../../adapters/git/head-sha/git-head-sha-adapter';
import { gitPushAdapter } from '../../../adapters/git/push/git-push-adapter';
import { gitUpstreamShaAdapter } from '../../../adapters/git/upstream-sha/git-upstream-sha-adapter';
import { gitVerifyRefAdapter } from '../../../adapters/git/verify-ref/git-verify-ref-adapter';
import { stepHandlerResultContract } from '../../../contracts/step-handler-result/step-handler-result-contract';
import type { StepHandlerResult } from '../../../contracts/step-handler-result/step-handler-result-contract';
import { BaseBranchNotFoundError } from '../../../errors/base-branch-not-found/base-branch-not-found-error';
import { QuestBranchNameTakenError } from '../../../errors/quest-branch-name-taken/quest-branch-name-taken-error';
import { WorktreePrepareError } from '../../../errors/worktree-prepare/worktree-prepare-error';
import { wardCommandStatics } from '../../../statics/ward-command/ward-command-statics';
import { worktreePrepareStepStatics } from '../../../statics/worktree-prepare-step/worktree-prepare-step-statics';
import { questToGitNamesTransformer } from '../../../transformers/quest-to-git-names/quest-to-git-names-transformer';
import { riftcarverFailureClassifyTransformer } from '../../../transformers/riftcarver-failure-classify/riftcarver-failure-classify-transformer';
import { worktreeFailureDetailTransformer } from '../../../transformers/worktree-failure-detail/worktree-failure-detail-transformer';
import { gitDetectBaseBranchBroker } from '../../git/detect-base-branch/git-detect-base-branch-broker';
import { riftcarverPersistResultBroker } from '../../riftcarver/persist-result/riftcarver-persist-result-broker';
import { worktreePrepareBroker } from '../../worktree/prepare/worktree-prepare-broker';
import { worktreeProvisionBroker } from '../../worktree/provision/worktree-provision-broker';
import { questFindQuestPathBroker } from '../../quest/find-quest-path/quest-find-quest-path-broker';
import { questGetBroker } from '../../quest/get/quest-get-broker';
import { questOperationsUpdateBroker } from '../../quest/operations-update/quest-operations-update-broker';
import { questRepoRootBroker } from '../../quest/repo-root/quest-repo-root-broker';

const STEPS = worktreePrepareStepStatics.steps;

const GREEN_EXIT_CODE = 0;
const FAILED_EXIT_CODE = 1;

type WorktreePrepareStepValue = (typeof STEPS)[keyof typeof STEPS];

type CarveResult =
  | {
      ok: true;
      branchName: QuestBranchName;
      baseBranch: BaseBranchName;
      worktreePath: AbsoluteFilePath;
      baseRef: NonNullable<Quest['baseRef']>;
    }
  | { ok: false; failedStep: WorktreePrepareStepValue; error: unknown };

export const stepHandlerRiftcarverBroker = async ({
  args: _args,
  questId,
  workItemId: _workItemId,
  onLine,
}: {
  args: string[];
  questId: QuestId;
  workItemId: QuestWorkItemId;
  onLine: (line: string) => void;
}): Promise<StepHandlerResult> => {
  const { questPath } = await questFindQuestPathBroker({ questId });

  const getResult = await questGetBroker({ input: getQuestInputContract.parse({ questId }) });
  if (!getResult.success || getResult.quest === undefined) {
    throw new Error(`Cannot run riftcarver for quest ${questId}: quest not found`);
  }
  const { quest } = getResult;

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
      // BASE BRANCH. Done-check: the recorded branch still resolves in the repo.
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

      // WORKTREE. Done-check reads DISK on both halves.
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

      // The collision check guards the FIRST carve against a name something else already owns.
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

      // BASE REF. Never recomputed once recorded.
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
      // This is NOT ledger routing — it touches none of `operations`/`workItems` — so it stays
      // here rather than moving to the router.
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

      // PROVISION — the mirror, the dist seed and the link audit, in that order.
      step.value = STEPS.nodeModules;
      const provisioned = await worktreeProvisionBroker({
        repoRoot,
        worktreePath,
        onLine: (line: string): void => {
          stream.emit(line);
        },
      });

      if (!provisioned.ok) {
        step.value = provisioned.failedStep;
        throw provisioned.error;
      }

      // TYPECHECK. Deliberately has NO done-check — this is the VERDICT the repair loop re-runs.
      step.value = STEPS.typecheck;
      const typecheck = await childProcessSpawnStreamLinesAdapter({
        command: process.env.WARD_CLI_PATH ?? wardCommandStatics.bin,
        args: [...wardCommandStatics.typecheckArgs],
        cwd: worktreePath,
        onLine: (line: string): void => {
          stream.emit(line);
        },
      });

      if (typecheck.exitCode !== GREEN_EXIT_CODE) {
        throw new WorktreePrepareError({
          step: STEPS.typecheck,
          detail: worktreeFailureDetailTransformer({
            worktreePath,
            cause: String(typecheck.output),
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

  // Every carve ends on a verdict line, green included: a first build pass emits hundreds of
  // TS6305 lines before a later one clears, so a log that just trails off on the last one reads
  // as an unreadable failure even when the carve is green.
  if (carve.ok) {
    stream.emit(`— CARVED: ${carve.branchName} at ${carve.baseRef} —`);
  } else {
    stream.emit(`— FAILED at ${carve.failedStep}: ${failureText} —`);
  }

  const exitCode = exitCodeContract.parse(carve.ok ? GREEN_EXIT_CODE : FAILED_EXIT_CODE);
  const outcome = carve.ok
    ? 'done'
    : riftcarverFailureClassifyTransformer({ failedStep: carve.failedStep, error: carve.error });

  const riftcarverResultId = crypto.randomUUID();

  await riftcarverPersistResultBroker({
    questFolderPath: filePathContract.parse(questPath),
    riftcarverResultId: riftcarverResultContract.shape.id.parse(riftcarverResultId),
    logContents: fileContentsContract.parse(carveLog.join('\n')),
  });

  const riftcarverResult = riftcarverResultContract.parse({
    id: riftcarverResultId,
    createdAt: new Date().toISOString(),
    exitCode,
    ...(carve.ok ? {} : { failedStep: carve.failedStep }),
    outcome: carve.ok ? 'green' : outcome === 'unmet' ? 'repairable' : 'blocked',
  });

  // `riftcarverResults` is not on `modifyQuestInputContract`'s shape — server-only fields with no
  // agent-facing write path go through `questOperationsUpdateBroker` instead, the same broker the
  // git-context persist above already uses, and for the same reason: this is a field-level append,
  // not a ledger (`operations`/`workItems`) decision.
  await questOperationsUpdateBroker({
    questId,
    update: ({ quest: current }) => ({
      riftcarverResults: [...current.riftcarverResults, riftcarverResult],
    }),
  });

  return stepHandlerResultContract.parse({
    outcome,
    detail: contentTextContract.parse(carveLog.join('\n')),
    resultRef: relatedDataItemContract.parse(`riftcarverResults/${riftcarverResult.id}`),
  });
};
