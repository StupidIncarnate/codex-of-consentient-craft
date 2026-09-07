/**
 * PURPOSE: The ONE sanctioned way to get a worktree, so that everything downstream can assume the
 * four properties a hand-rolled `git worktree add` silently lacks: it sits under the repo's own
 * `worktrees/`, its `node_modules` is hardlinked (so it runs its OWN ward, hooks and CLI), its
 * compiled output is there at all, and every link in it stays inside it. A worktree missing any of
 * those looks completely normal until a run comes back green against code it never saw.
 *
 * IDEMPOTENT, and deliberately so — a caller asking twice for the same name wants the same tree,
 * not a second carve or a refusal. An existing `worktrees/<name>` skips only the git step, which is
 * the one thing with no done-check of its own; the mirror, the seed and the audit run every time
 * and each decides for itself what is already satisfied. That is also what makes this the right
 * call to REPAIR a half-built tree with.
 *
 * USAGE:
 * const { worktreePath } = await WorktreeCreateResponder({ name: 'probe' });
 * // '/repo/worktrees/probe' — carved off the detected base branch, mirrored, seeded and audited
 */

import { processCwdAdapter } from '@dungeonmaster/shared/adapters';
import { cwdResolveBroker, locationsWorktreePathFindBroker } from '@dungeonmaster/shared/brokers';
import {
  absoluteFilePathContract,
  fileNameContract,
  filePathContract,
  questBranchNameContract,
  type AbsoluteFilePath,
} from '@dungeonmaster/shared/contracts';

import { fsIsAccessibleAdapter } from '../../../adapters/fs/is-accessible/fs-is-accessible-adapter';
import { gitDetectBaseBranchBroker } from '../../../brokers/git/detect-base-branch/git-detect-base-branch-broker';
import { worktreePopulateNodeModulesBroker } from '../../../brokers/worktree/populate-node-modules/worktree-populate-node-modules-broker';
import { worktreePrepareBroker } from '../../../brokers/worktree/prepare/worktree-prepare-broker';
import { worktreeSeedDistBroker } from '../../../brokers/worktree/seed-dist/worktree-seed-dist-broker';
import { worktreeVerifyLinksBroker } from '../../../brokers/worktree/verify-links/worktree-verify-links-broker';
import { BaseBranchNotFoundError } from '../../../errors/base-branch-not-found/base-branch-not-found-error';

export const WorktreeCreateResponder = async ({
  name,
}: {
  name: string;
}): Promise<{ worktreePath: AbsoluteFilePath }> => {
  const repoRoot = absoluteFilePathContract.parse(
    await cwdResolveBroker({ startPath: processCwdAdapter(), kind: 'repo-root' }),
  );
  const worktreeDirName = fileNameContract.parse(name);
  const worktreePath = locationsWorktreePathFindBroker({ repoRoot, worktreeDirName });

  // The directory is the done-check for the git step, because `git worktree add` is the one step
  // with no done-check of its own — it refuses a path that already exists rather than resolving.
  const alreadyCarved = await fsIsAccessibleAdapter({
    filePath: filePathContract.parse(worktreePath),
  });

  if (!alreadyCarved) {
    const baseBranch = await gitDetectBaseBranchBroker({ cwd: repoRoot });

    if (baseBranch === null) {
      throw new BaseBranchNotFoundError();
    }

    // The worktree directory name doubles as the branch name, so a worktree is discoverable from
    // its branch and back again without reading anything.
    await worktreePrepareBroker({
      repoRoot,
      worktreePath,
      branchName: questBranchNameContract.parse(name),
      baseBranch,
    });
  }

  // `() => undefined` is the DELIBERATE opt-out the streaming contract asks a caller to make out
  // loud (packages/shared/CLAUDE.md, "Streaming Adapters"). This entry point answers one value to
  // one caller and has no surface to put lines on; the riftcarver path, which runs for minutes in
  // front of a live panel, wires the real callback instead.
  await worktreePopulateNodeModulesBroker({ repoRoot, worktreePath, onLine: () => undefined });
  await worktreeSeedDistBroker({ repoRoot, worktreePath });

  // LAST, and after the mirror rather than before it, because the links it audits are the ones the
  // mirror just wrote. It refuses to let the path out rather than repairing: a caller handed a
  // leaking worktree runs commands that grade the main checkout and report green.
  await worktreeVerifyLinksBroker({ worktreePath });

  return { worktreePath };
};
