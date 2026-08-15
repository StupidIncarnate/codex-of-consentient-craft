import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';
import {
  AbsoluteFilePathStub,
  BaseBranchNameStub,
  FileContentsStub,
  FileNameStub,
  QuestBranchNameStub,
  RepoRelativePathStub,
} from '@dungeonmaster/shared/contracts';

import { worktreeResumeRestoreBroker } from './worktree-resume-restore-broker';
import { gitWorktreeAddAdapter } from '../../../adapters/git/worktree-add/git-worktree-add-adapter';
import { gitWorktreeFixtureHarness } from '../../../../test/harnesses/git-worktree-fixture/git-worktree-fixture.harness';

// Real git throughout. worktree-resume-restore-broker.test.ts mocks gitCurrentBranchAdapter /
// gitCheckoutAdapter and only proves the broker CALLED them with the right args — it cannot settle
// "git -C <worktreePath> rev-parse --abbrev-ref HEAD returns the quest branch after resume" or
// "the dirty file's contents are byte-identical before and after," both of which need a real repo.
describe('worktreeResumeRestoreBroker (integration) — real drift restore + uncommitted-work preservation', () => {
  const git = gitWorktreeFixtureHarness();

  it('VALID: {worktree was left checked out on a different branch} => resume checks it back out onto the quest branch', async () => {
    const testbed = installTestbedCreateBroker({ baseName: BaseNameStub({ value: 'wrr-drift' }) });
    const repoPath = AbsoluteFilePathStub({ value: testbed.guildPath });

    await git.initRepoWithPackages({
      repoPath,
      initialBranchName: FileNameStub({ value: 'main' }),
      packageNames: [FileNameStub({ value: 'shared' }), FileNameStub({ value: 'web' })],
    });
    const strayBranch = FileNameStub({ value: 'stray-branch' });
    await git.createBranchAt({ repoPath, branchName: strayBranch });

    const worktreePath = AbsoluteFilePathStub({
      value: `${testbed.guildPath}/worktrees/drift-22223333`,
    });
    const branchName = QuestBranchNameStub({ value: 'quest/drift-22223333' });
    await gitWorktreeAddAdapter({
      cwd: repoPath,
      worktreePath,
      branchName,
      baseBranch: BaseBranchNameStub({ value: 'main' }),
      mode: 'create-branch',
    });

    // Simulate drift: the worktree ends up checked out on a branch other than its own quest
    // branch (a failed earlier restore, or a manual checkout inside it).
    await git.checkoutBranch({ repoPath: worktreePath, branchName: strayBranch });
    const branchBeforeRestore = await git.gitCurrentBranchName({ repoPath: worktreePath });

    const result = await worktreeResumeRestoreBroker({ worktreePath, branchName });

    const branchAfterRestore = await git.gitCurrentBranchName({ repoPath: worktreePath });

    testbed.cleanup();

    expect({
      branchBeforeRestore,
      restored: result.restored,
      branchAfterRestore,
    }).toStrictEqual({
      branchBeforeRestore: strayBranch,
      restored: true,
      branchAfterRestore: branchName,
    });
  }, 30_000);

  it('VALID: {worktree already on its quest branch, an uncommitted edit sits in it} => resume leaves the dirty file exactly as it was — no stash, no reset', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'wrr-preserve' }),
    });
    const repoPath = AbsoluteFilePathStub({ value: testbed.guildPath });

    await git.initRepoWithPackages({
      repoPath,
      initialBranchName: FileNameStub({ value: 'main' }),
      packageNames: [FileNameStub({ value: 'shared' }), FileNameStub({ value: 'web' })],
    });

    const worktreePath = AbsoluteFilePathStub({
      value: `${testbed.guildPath}/worktrees/preserve-55556666`,
    });
    const branchName = QuestBranchNameStub({ value: 'quest/preserve-55556666' });
    // `git worktree add -b <branch>` checks the new branch out in the worktree immediately, so
    // this worktree starts ALREADY on its own quest branch — the interrupted-edits case, where
    // nothing drifted and restore's only job is to leave the dirty file alone.
    await gitWorktreeAddAdapter({
      cwd: repoPath,
      worktreePath,
      branchName,
      baseBranch: BaseBranchNameStub({ value: 'main' }),
      mode: 'create-branch',
    });

    const dirtyContent = FileContentsStub({
      value: '# fixture repo\nuncommitted edit from a killed agent session\n',
    });
    git.dirtyTrackedFile({
      repoPath: worktreePath,
      relativePath: RepoRelativePathStub({ value: 'README.md' }),
      content: dirtyContent,
    });

    const statusBefore = await git.gitStatusPorcelain({ repoPath: worktreePath });
    const contentBefore = git.readTextFile({
      absolutePath: AbsoluteFilePathStub({ value: `${worktreePath}/README.md` }),
    });

    const result = await worktreeResumeRestoreBroker({ worktreePath, branchName });

    const statusAfter = await git.gitStatusPorcelain({ repoPath: worktreePath });
    const contentAfter = git.readTextFile({
      absolutePath: AbsoluteFilePathStub({ value: `${worktreePath}/README.md` }),
    });

    testbed.cleanup();

    expect({
      restored: result.restored,
      statusBefore,
      statusAfter,
      contentBefore,
      contentAfter,
    }).toStrictEqual({
      restored: true,
      statusBefore: 'M README.md',
      statusAfter: 'M README.md',
      contentBefore: dirtyContent,
      contentAfter: dirtyContent,
    });
  }, 30_000);
});
