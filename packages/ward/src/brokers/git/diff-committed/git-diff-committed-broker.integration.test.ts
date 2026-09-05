import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { GitBranchNameStub } from '../../../contracts/git-branch-name/git-branch-name.stub';
import { GitRelativePathStub } from '../../../contracts/git-relative-path/git-relative-path.stub';
import { wardGitWorktreeFixtureHarness } from '../../../../test/harnesses/git-worktree-fixture/git-worktree-fixture.harness';

import { gitDiffCommittedBroker } from './git-diff-committed-broker';

// quest-agent-cwd:observable:ward-diff-scoped-to-branch — "the changed-file list ward reports is
// computed from the quest's baseRef inside the worktree and contains no file whose only
// modification lives in the repo root checkout." git-diff-committed-broker.test.ts (the unit suite)
// mocks the spawn adapter exclusively with cwd pinned to the literal stub string '/project', which
// is NEVER varied — nothing there can distinguish a diff computed in a worktree from one computed
// in the repo root checkout that produced it. Real git worktrees are separate working directories
// that share one object database, so this needs the real thing: a real `git worktree add`, real
// commits on each side, and a real `git diff` run with cwd pointed at the worktree.
describe('gitDiffCommittedBroker (integration) — real git worktree isolation', () => {
  const git = wardGitWorktreeFixtureHarness();

  it('VALID: {a file committed only in the repo-root checkout, different files committed only in the worktree} => the diff computed with cwd at the worktree contains only the worktree files', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'ward-diff-worktree-scope' }),
    });
    const repoPath = AbsoluteFilePathStub({ value: testbed.guildPath });
    await git.initRepo({ repoPath });

    const worktreePath = AbsoluteFilePathStub({
      value: `${testbed.guildPath}/worktrees/quest-branch`,
    });
    await git.addWorktree({
      repoPath,
      worktreePath,
      branchName: GitBranchNameStub({ value: 'quest/diff-scope-test' }),
    });

    // Advances `main` in the REPO ROOT checkout only — the worktree's branch tip does not move.
    // This is the file the observable says must never appear in a diff computed from the worktree.
    await git.commitFile({
      cwd: repoPath,
      relativePath: GitRelativePathStub({ value: 'repo-root-only.txt' }),
      content: 'only in the repo root\n',
    });

    // Two files committed on the quest branch, inside the worktree. One is the hostile-input
    // fixture member (FIXTURE REQUIREMENTS): a directory segment containing a space.
    await git.commitFile({
      cwd: worktreePath,
      relativePath: GitRelativePathStub({ value: 'worktree-file.txt' }),
      content: 'only in the worktree\n',
    });
    await git.commitFile({
      cwd: worktreePath,
      relativePath: GitRelativePathStub({ value: 'folder with space/file name.ts' }),
      content: 'hostile path segment\n',
    });

    const result = await gitDiffCommittedBroker({ cwd: worktreePath });

    testbed.cleanup();

    // toStrictEqual on the COMPLETE list — not an absence check on repo-root-only.txt alone, which
    // would be vacuous unless this same assertion also shows the worktree files present. Order
    // matches git's own tree-order output (lexicographic on this fixture's flat + one-level shape).
    expect(result).toStrictEqual([
      GitRelativePathStub({ value: 'folder with space/file name.ts' }),
      GitRelativePathStub({ value: 'worktree-file.txt' }),
    ]);
  }, 30_000);

  // The ref this broker measures from is the half a mocked spawn cannot see: an origin/main and a
  // local main that have diverged are the same two positional `git` calls under a mock. Proving the
  // remote ref wins needs a real remote whose default branch is genuinely behind the local one.
  it('VALID: {local main ahead of origin/main, both real} => measures from origin/main, so the local-only commit is IN scope', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'ward-diff-committed-origin-base' }),
    });
    const repoPath = AbsoluteFilePathStub({ value: `${testbed.guildPath}/repo` });
    const remotePath = AbsoluteFilePathStub({ value: `${testbed.guildPath}/origin.git` });
    const mainBranch = GitBranchNameStub({ value: 'main' });

    await git.initRepo({ repoPath });
    await git.initBareRemote({ remotePath });
    await git.addRemote({ cwd: repoPath, remotePath });
    await git.pushBranch({ cwd: repoPath, branchName: mainBranch });

    // Committed on local main and NEVER pushed. Measured against the local default branch this is
    // invisible, because HEAD is that branch; measured against origin/main it is the answer.
    await git.commitFile({
      cwd: repoPath,
      relativePath: GitRelativePathStub({ value: 'unpushed-work.ts' }),
      content: 'export const unpushed = 1;\n',
    });

    // An uncommitted edit to a TRACKED file. It belongs to `--uncommitted`, so it must not appear.
    git.writeUncommittedFile({
      cwd: repoPath,
      relativePath: GitRelativePathStub({ value: 'base.txt' }),
      content: 'edited but never committed\n',
    });

    const result = await gitDiffCommittedBroker({ cwd: repoPath });

    testbed.cleanup();

    expect(result).toStrictEqual([GitRelativePathStub({ value: 'unpushed-work.ts' })]);
  }, 30_000);
});
