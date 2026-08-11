/**
 * PURPOSE: Runs every step that must succeed before a quest branch's worktree is fit to dispatch
 * agents into — creation, the fork-point stamp, node_modules, and the preflight build — as one
 * awaited chain, and rolls the worktree back through `worktreeDiscardBroker` on any step's failure.
 * Nothing is written to `quest.json` until this resolves, so a worktree left behind after a failed
 * prepare would make the next Start hit the name-taken refusal and the quest could never start again
 * — the rollback is what makes retry possible. Reads the fork-point sha immediately after creation,
 * before node_modules or the build can touch the tree, because that is the one moment the worktree's
 * HEAD is guaranteed to equal the base branch tip the quest forked from.
 *
 * USAGE:
 * const { baseRef } = await worktreePrepareBroker({
 *   repoRoot: AbsoluteFilePathStub({ value: '/repo' }),
 *   worktreePath: AbsoluteFilePathStub({ value: '/repo/worktrees/add-auth-7bc217a1' }),
 *   branchName: QuestBranchNameStub({ value: 'quest/add-auth-7bc217a1' }),
 *   baseBranch: BaseBranchNameStub({ value: 'main' }),
 *   buildCommand: 'npm run build',
 * });
 * // Rejects with WorktreePrepareError, naming the failing step, on any failure
 */

import type {
  AbsoluteFilePath,
  BaseBranchName,
  Quest,
  QuestBranchName,
} from '@dungeonmaster/shared/contracts';

import { gitHeadShaAdapter } from '../../../adapters/git/head-sha/git-head-sha-adapter';
import { gitWorktreeAddAdapter } from '../../../adapters/git/worktree-add/git-worktree-add-adapter';
import { WorktreePrepareError } from '../../../errors/worktree-prepare/worktree-prepare-error';
import { worktreePrepareStepStatics } from '../../../statics/worktree-prepare-step/worktree-prepare-step-statics';
import { worktreeFailureDetailTransformer } from '../../../transformers/worktree-failure-detail/worktree-failure-detail-transformer';
import { worktreeDiscardBroker } from '../discard/worktree-discard-broker';
import { worktreePopulateNodeModulesBroker } from '../populate-node-modules/worktree-populate-node-modules-broker';
import { buildUntilGreenLayerBroker } from './build-until-green-layer-broker';

type GitBaseRef = NonNullable<Quest['baseRef']>;

const STEPS = worktreePrepareStepStatics.steps;

export const worktreePrepareBroker = async ({
  repoRoot,
  worktreePath,
  branchName,
  baseBranch,
  buildCommand,
}: {
  repoRoot: AbsoluteFilePath;
  worktreePath: AbsoluteFilePath;
  branchName: QuestBranchName;
  baseBranch: BaseBranchName;
  buildCommand: string;
}): Promise<{ baseRef: GitBaseRef }> => {
  const addResult = await gitWorktreeAddAdapter({
    cwd: repoRoot,
    worktreePath,
    branchName,
    baseBranch,
  });

  if (addResult.exitCode !== 0) {
    // Nothing was created, so there is nothing to roll back — calling `git worktree remove` on a
    // path git never registered would manufacture a second, unrelated error.
    throw new WorktreePrepareError({
      step: STEPS.create,
      detail: worktreeFailureDetailTransformer({ worktreePath, cause: addResult.output }),
    });
  }

  const baseRef = await gitHeadShaAdapter({ cwd: worktreePath });

  if (baseRef === null) {
    const { discarded, output } = await worktreeDiscardBroker({
      repoRoot,
      worktreePath,
      branchName,
    });
    throw new WorktreePrepareError({
      step: STEPS.create,
      detail: worktreeFailureDetailTransformer({
        worktreePath,
        cause: 'fork-point sha could not be read',
        ...(discarded ? {} : { cleanupOutput: output }),
      }),
    });
  }

  try {
    await worktreePopulateNodeModulesBroker({ repoRoot, worktreePath });
  } catch (error) {
    const { discarded, output } = await worktreeDiscardBroker({
      repoRoot,
      worktreePath,
      branchName,
    });
    throw new WorktreePrepareError({
      step: STEPS.nodeModules,
      detail: worktreeFailureDetailTransformer({
        worktreePath,
        cause: error instanceof Error ? error.message : String(error),
        ...(discarded ? {} : { cleanupOutput: output }),
      }),
    });
  }

  const buildResult = await buildUntilGreenLayerBroker({ buildCommand, cwd: worktreePath });

  if (!buildResult.success) {
    const { discarded, output } = await worktreeDiscardBroker({
      repoRoot,
      worktreePath,
      branchName,
    });
    throw new WorktreePrepareError({
      step: STEPS.build,
      detail: worktreeFailureDetailTransformer({
        worktreePath,
        cause: buildResult.output,
        ...(discarded ? {} : { cleanupOutput: output }),
      }),
    });
  }

  return { baseRef };
};
