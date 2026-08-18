import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { GitBranchNameStub } from '../../../contracts/git-branch-name/git-branch-name.stub';
import { GitRelativePathStub } from '../../../contracts/git-relative-path/git-relative-path.stub';
import { wardGitWorktreeFixtureHarness } from '../../../../test/harnesses/git-worktree-fixture/git-worktree-fixture.harness';

import { gitDiffUnpushedBroker } from './git-diff-unpushed-broker';

// The whole point of this broker is WHICH ref it measures against, and the unit suite cannot see
// that: it mocks `spawn` and answers every `git` call positionally, so a diff taken against
// origin/main and one taken against a local branch are the same two mocked calls in the same order.
// Proving "already-pushed work stays out of scope" needs a real remote, real commits on both sides
// of the push boundary, and a real `git diff`.
describe('gitDiffUnpushedBroker (integration) — real remote, pushed vs unpushed', () => {
  const git = wardGitWorktreeFixtureHarness();

  it('VALID: {one pushed commit, one unpushed commit, one uncommitted edit} => returns the unpushed commit and the edit, never the pushed commit', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'ward-diff-unpushed' }),
    });
    const repoPath = AbsoluteFilePathStub({ value: `${testbed.guildPath}/repo` });
    const remotePath = AbsoluteFilePathStub({ value: `${testbed.guildPath}/origin.git` });
    const mainBranch = GitBranchNameStub({ value: 'main' });

    await git.initRepo({ repoPath });
    await git.initBareRemote({ remotePath });
    await git.addRemote({ cwd: repoPath, remotePath });
    await git.pushBranch({ cwd: repoPath, branchName: mainBranch });

    // Committed AND pushed — origin already has it, so it must not appear below.
    await git.commitFile({
      cwd: repoPath,
      relativePath: GitRelativePathStub({ value: 'pushed-work.ts' }),
      content: 'export const pushed = 1;\n',
    });
    await git.pushBranch({ cwd: repoPath, branchName: mainBranch });

    // Committed but NOT pushed — this is the case `--changed` misses on a branch that IS the
    // default branch, and the reason --staged exists.
    await git.commitFile({
      cwd: repoPath,
      relativePath: GitRelativePathStub({ value: 'unpushed-work.ts' }),
      content: 'export const unpushed = 2;\n',
    });

    // Uncommitted edit to a TRACKED file. `git diff` reports tracked paths only, so an edit to an
    // existing file is what proves working-tree changes are in scope.
    git.writeUncommittedFile({
      cwd: repoPath,
      relativePath: GitRelativePathStub({ value: 'base.txt' }),
      content: 'base edited but never committed\n',
    });

    const result = await gitDiffUnpushedBroker({ cwd: repoPath });

    testbed.cleanup();

    // toStrictEqual on the COMPLETE list: asserting pushed-work.ts is absent would be vacuous unless
    // the same assertion also shows the other two present. Order is git's own lexicographic output.
    expect(result).toStrictEqual([
      GitRelativePathStub({ value: 'base.txt' }),
      GitRelativePathStub({ value: 'unpushed-work.ts' }),
    ]);
  }, 30_000);

  it('VALID: {branch never pushed, so no tracking ref} => falls back to origin/main and returns only that branch commits', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'ward-diff-unpushed-no-upstream' }),
    });
    const repoPath = AbsoluteFilePathStub({ value: `${testbed.guildPath}/repo` });
    const remotePath = AbsoluteFilePathStub({ value: `${testbed.guildPath}/origin.git` });

    await git.initRepo({ repoPath });
    await git.initBareRemote({ remotePath });
    await git.addRemote({ cwd: repoPath, remotePath });
    await git.pushBranch({ cwd: repoPath, branchName: GitBranchNameStub({ value: 'main' }) });

    await git.commitFile({
      cwd: repoPath,
      relativePath: GitRelativePathStub({ value: 'pushed-work.ts' }),
      content: 'export const pushed = 1;\n',
    });
    await git.pushBranch({ cwd: repoPath, branchName: GitBranchNameStub({ value: 'main' }) });

    // No push for this branch, so `git rev-parse @{upstream}` fails and origin/main is the fallback.
    await git.checkoutNewBranch({
      cwd: repoPath,
      branchName: GitBranchNameStub({ value: 'feature/unpushed-branch' }),
    });
    await git.commitFile({
      cwd: repoPath,
      relativePath: GitRelativePathStub({ value: 'feature-work.ts' }),
      content: 'export const feature = 3;\n',
    });

    const result = await gitDiffUnpushedBroker({ cwd: repoPath });

    testbed.cleanup();

    expect(result).toStrictEqual([GitRelativePathStub({ value: 'feature-work.ts' })]);
  }, 30_000);
});
