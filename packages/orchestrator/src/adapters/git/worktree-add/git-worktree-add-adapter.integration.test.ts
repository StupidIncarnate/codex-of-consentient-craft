import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';
import {
  AbsoluteFilePathStub,
  BaseBranchNameStub,
  ErrorMessageStub,
  FileContentsStub,
  FileNameStub,
  QuestBranchNameStub,
  RepoRelativePathStub,
} from '@dungeonmaster/shared/contracts';

import { gitWorktreeAddAdapter } from './git-worktree-add-adapter';
import { gitWorktreeFixtureHarness } from '../../../../test/harnesses/git-worktree-fixture/git-worktree-fixture.harness';

// The quest-agent-cwd flow's isolation observables are pure git-worktree invariants: once
// `gitWorktreeAddAdapter` (the ONE place a worktree is ever created — see its own PURPOSE
// comment) has produced a real worktree, does editing/committing at that path stay isolated from
// the repo root checkout and the base branch? Neither observable names questCwdResolveBroker or a
// spawn — cwd-read-from-quest (out of this bundle) is what proves the CWD VALUE traces back to the
// quest record; these tests stand in for "an agent edits/commits" with a direct write at the real
// worktree path a real `git worktree add` produced, and read the resulting git state back.
describe('gitWorktreeAddAdapter (integration) — real worktree isolation for agent edits', () => {
  const git = gitWorktreeFixtureHarness();

  it('VALID: {a tracked file is edited inside the worktree} => the edit shows modified only in the worktree, the repo root checkout stays clean, and the worktree HEAD stays on the quest branch', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'gwa-edit-isolation' }),
    });
    const repoPath = AbsoluteFilePathStub({ value: testbed.guildPath });

    await git.initRepoWithPackages({
      repoPath,
      initialBranchName: FileNameStub({ value: 'main' }),
      packageNames: [FileNameStub({ value: 'shared' }), FileNameStub({ value: 'web' })],
    });

    const worktreePath = AbsoluteFilePathStub({
      value: `${testbed.guildPath}/worktrees/edit-44445555`,
    });
    const branchName = QuestBranchNameStub({ value: 'quest/edit-44445555' });
    const baseBranch = BaseBranchNameStub({ value: 'main' });

    const { exitCode } = await gitWorktreeAddAdapter({
      cwd: repoPath,
      worktreePath,
      branchName,
      baseBranch,
    });

    // Stands in for "the agent edits a file" — the real path this proves is the worktree's git
    // isolation, which is what any later agent edit depends on regardless of who makes it.
    git.dirtyTrackedFile({
      repoPath: worktreePath,
      relativePath: RepoRelativePathStub({ value: 'README.md' }),
      content: FileContentsStub({ value: '# fixture repo\nedited by the agent\n' }),
    });

    const worktreeStatus = await git.gitStatusPorcelain({ repoPath: worktreePath });
    const repoRootStatus = await git.gitStatusPorcelain({ repoPath });
    const worktreeBranch = await git.gitCurrentBranchName({ repoPath: worktreePath });

    testbed.cleanup();

    expect({ addExitCode: exitCode, worktreeStatus, repoRootStatus, worktreeBranch }).toStrictEqual(
      {
        addExitCode: 0,
        worktreeStatus: 'M README.md',
        repoRootStatus: '',
        worktreeBranch: branchName,
      },
    );
  }, 30_000);

  it('VALID: {a commit is made inside the worktree} => the commit becomes the quest branch tip, and the base branch tip is unchanged so the commit is absent from its log', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'gwa-commit-isolation' }),
    });
    const repoPath = AbsoluteFilePathStub({ value: testbed.guildPath });

    await git.initRepoWithPackages({
      repoPath,
      initialBranchName: FileNameStub({ value: 'main' }),
      packageNames: [FileNameStub({ value: 'shared' }), FileNameStub({ value: 'web' })],
    });

    const worktreePath = AbsoluteFilePathStub({
      value: `${testbed.guildPath}/worktrees/commit-99990000`,
    });
    const branchName = QuestBranchNameStub({ value: 'quest/commit-99990000' });
    const baseBranch = BaseBranchNameStub({ value: 'main' });

    await gitWorktreeAddAdapter({ cwd: repoPath, worktreePath, branchName, baseBranch });

    const baseBranchShaBeforeCommit = await git.gitRevParseOrNull({
      repoPath,
      ref: ErrorMessageStub({ value: baseBranch }),
    });

    // Stands in for "the agent commits" inside its own worktree.
    const { sha: agentCommitSha } = await git.commitFile({
      repoPath: worktreePath,
      relativePath: RepoRelativePathStub({ value: 'packages/shared/NOTES.md' }),
      content: FileContentsStub({ value: 'agent notes\n' }),
      message: ErrorMessageStub({ value: 'agent commit inside the worktree' }),
    });

    const questBranchSha = await git.gitRevParseOrNull({
      repoPath,
      ref: ErrorMessageStub({ value: branchName }),
    });
    const baseBranchShaAfterCommit = await git.gitRevParseOrNull({
      repoPath,
      ref: ErrorMessageStub({ value: baseBranch }),
    });
    const worktreeBranch = await git.gitCurrentBranchName({ repoPath: worktreePath });

    testbed.cleanup();

    expect({
      questBranchSha,
      agentCommitSha,
      baseBranchShaAfterCommit,
      baseBranchShaBeforeCommit,
      worktreeBranch,
    }).toStrictEqual({
      questBranchSha: agentCommitSha,
      agentCommitSha,
      baseBranchShaAfterCommit: baseBranchShaBeforeCommit,
      baseBranchShaBeforeCommit,
      worktreeBranch: branchName,
    });
  }, 30_000);
});
