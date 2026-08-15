/**
 * PURPOSE: Carves the quest's worktree and stamps its fork point — nothing else. The sha is read in
 * the same breath as creation, before node_modules or a build can touch the tree, because that is
 * the one moment a NEWLY created worktree's HEAD is guaranteed to equal the base branch tip the
 * quest forked from; recomputing it later would fold the quest's own commits into whatever measures
 * against it. (A caller re-carving a quest that already recorded a `baseRef` keeps its own record —
 * see quest-run-riftcarver-broker — so the sha returned here is a first-carve value, not an
 * authority that overrides one.)
 *
 * Whether the branch is MINTED or ATTACHED is decided by probing git, never by trusting a record:
 * a branch that resolves right now already holds the quest's commits, so the worktree is checked
 * out against it (after a prune clears any registration git still holds for a directory someone
 * deleted). This is what makes a re-carve possible at all — a `-b` create against a branch the
 * first attempt already made refuses, and the quest would be locked out permanently. Deciding
 * OWNERSHIP is not this broker's job: the caller's collision check is what refuses a name some
 * other work owns, and by the time it delegates here an existing branch is the quest's own.
 *
 * Rollback belongs here and nowhere further down the lifecycle. This step's failure leaves a branch
 * and a directory that a later attempt would collide with, so discarding them is what makes the
 * retry possible — whereas a half-mirrored or half-built tree is exactly what a spiritmender needs
 * to repair, so the steps that follow keep theirs. Two cases roll nothing back: a failed
 * `git worktree add` (git registered no path, so removing one would manufacture a second, unrelated
 * error) and an ATTACHED branch (the discard deletes the branch, and this one holds commits this
 * call did not create).
 *
 * USAGE:
 * const { baseRef } = await worktreePrepareBroker({
 *   repoRoot: AbsoluteFilePathStub({ value: '/repo' }),
 *   worktreePath: AbsoluteFilePathStub({ value: '/repo/worktrees/add-auth-7bc217a1' }),
 *   branchName: QuestBranchNameStub({ value: 'quest/add-auth-7bc217a1' }),
 *   baseBranch: BaseBranchNameStub({ value: 'main' }),
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
import { gitVerifyRefAdapter } from '../../../adapters/git/verify-ref/git-verify-ref-adapter';
import { gitWorktreeAddAdapter } from '../../../adapters/git/worktree-add/git-worktree-add-adapter';
import { gitWorktreePruneAdapter } from '../../../adapters/git/worktree-prune/git-worktree-prune-adapter';
import { WorktreePrepareError } from '../../../errors/worktree-prepare/worktree-prepare-error';
import { worktreePrepareStepStatics } from '../../../statics/worktree-prepare-step/worktree-prepare-step-statics';
import { worktreeFailureDetailTransformer } from '../../../transformers/worktree-failure-detail/worktree-failure-detail-transformer';
import { worktreeDiscardBroker } from '../discard/worktree-discard-broker';

type GitBaseRef = NonNullable<Quest['baseRef']>;

const STEPS = worktreePrepareStepStatics.steps;

export const worktreePrepareBroker = async ({
  repoRoot,
  worktreePath,
  branchName,
  baseBranch,
}: {
  repoRoot: AbsoluteFilePath;
  worktreePath: AbsoluteFilePath;
  branchName: QuestBranchName;
  baseBranch: BaseBranchName;
}): Promise<{ baseRef: GitBaseRef }> => {
  // The REAL probe, not the quest record: git is the only authority on whether this branch exists
  // right now, and the answer decides the mode below.
  const branchExists = await gitVerifyRefAdapter({ cwd: repoRoot, ref: branchName });

  // A directory deleted out from under a worktree leaves git's registration behind, and both the
  // add and the branch stay refused until it is dropped. Only the attach path can meet that state.
  const pruned = branchExists ? await gitWorktreePruneAdapter({ cwd: repoRoot }) : null;

  const addResult = await gitWorktreeAddAdapter({
    cwd: repoRoot,
    worktreePath,
    branchName,
    baseBranch,
    mode: branchExists ? 'attach-existing' : 'create-branch',
  });

  if (addResult.exitCode !== 0) {
    // Nothing was created, so there is nothing to roll back — calling `git worktree remove` on a
    // path git never registered would manufacture a second, unrelated error. A prune that also
    // failed rides along, since it is the likeliest reason an attach was refused.
    throw new WorktreePrepareError({
      step: STEPS.create,
      detail: worktreeFailureDetailTransformer({
        worktreePath,
        cause: String(addResult.output),
        ...(pruned === null || pruned.exitCode === 0 ? {} : { cleanupOutput: pruned.output }),
      }),
    });
  }

  const baseRef = await gitHeadShaAdapter({ cwd: worktreePath });

  if (baseRef !== null) {
    return { baseRef };
  }

  // An ATTACHED branch is not this call's to destroy: `worktreeDiscardBroker` deletes the branch,
  // and this one already holds the quest's commits. Report and leave it standing.
  if (branchExists) {
    throw new WorktreePrepareError({
      step: STEPS.create,
      detail: worktreeFailureDetailTransformer({
        worktreePath,
        cause: 'fork-point sha could not be read',
      }),
    });
  }

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
};
