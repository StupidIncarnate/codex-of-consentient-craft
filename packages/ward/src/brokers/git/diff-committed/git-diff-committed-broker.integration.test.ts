import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { GitBranchNameStub } from '../../../contracts/git-branch-name/git-branch-name.stub';
import { GitRelativePathStub } from '../../../contracts/git-relative-path/git-relative-path.stub';
import { wardGitWorktreeFixtureHarness } from '../../../../test/harnesses/git-worktree-fixture/git-worktree-fixture.harness';

import { gitDiffFilesBroker } from './git-diff-files-broker';

// quest-agent-cwd:observable:ward-diff-scoped-to-branch — "the changed-file list ward reports is
// computed from the quest's baseRef inside the worktree and contains no file whose only
// modification lives in the repo root checkout." git-diff-files-broker.test.ts (the unit suite)
// mocks the spawn adapter exclusively with cwd pinned to the literal stub string '/project', which
// is NEVER varied — nothing there can distinguish a diff computed in a worktree from one computed
// in the repo root checkout that produced it. Real git worktrees are separate working directories
// that share one object database, so this needs the real thing: a real `git worktree add`, real
// commits on each side, and a real `git diff` run with cwd pointed at the worktree.
describe('gitDiffFilesBroker (integration) — real git worktree isolation', () => {
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

    const result = await gitDiffFilesBroker({ cwd: worktreePath });

    testbed.cleanup();

    // toStrictEqual on the COMPLETE list — not an absence check on repo-root-only.txt alone, which
    // would be vacuous unless this same assertion also shows the worktree files present. Order
    // matches git's own tree-order output (lexicographic on this fixture's flat + one-level shape).
    expect(result).toStrictEqual([
      GitRelativePathStub({ value: 'folder with space/file name.ts' }),
      GitRelativePathStub({ value: 'worktree-file.txt' }),
    ]);
  }, 30_000);
});
