import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';
import {
  AbsoluteFilePathStub,
  BaseBranchNameStub,
  FileNameStub,
  QuestBranchNameStub,
  QuestIdStub,
  QuestStub,
  RepoRootCwdStub,
} from '@dungeonmaster/shared/contracts';

import { gitWorktreeAddAdapter } from '../../../adapters/git/worktree-add/git-worktree-add-adapter';
import { QuestCwdResolutionStub } from '../../../contracts/quest-cwd-resolution/quest-cwd-resolution.stub';
import { QuestResumeTriggerStub } from '../../../contracts/quest-resume-trigger/quest-resume-trigger.stub';
import { gitWorktreeFixtureHarness } from '../../../../test/harnesses/git-worktree-fixture/git-worktree-fixture.harness';
import { worktreeEnsureQuestBranchBroker } from './worktree-ensure-quest-branch-broker';

// Real git throughout. worktree-ensure-quest-branch-broker.test.ts stages `child_process.spawn` and
// can only prove the broker ISSUED `git checkout <branch>`; it cannot settle "`git -C <worktree>
// rev-parse --abbrev-ref HEAD` reports the quest branch afterwards", which is the thing an agent
// spawned into that worktree actually commits against.
describe('worktreeEnsureQuestBranchBroker (integration) — real drift restore at a quest pickup', () => {
  const git = gitWorktreeFixtureHarness();

  it('VALID: {worktree drifted onto a stray branch, kind: worktree} => the worktree really is back on the quest branch afterwards', async () => {
    const testbed = installTestbedCreateBroker({ baseName: BaseNameStub({ value: 'weqb-drift' }) });
    const repoPath = AbsoluteFilePathStub({ value: testbed.guildPath });

    await git.initRepoWithPackages({
      repoPath,
      initialBranchName: FileNameStub({ value: 'main' }),
      packageNames: [FileNameStub({ value: 'shared' })],
    });
    const strayBranch = FileNameStub({ value: 'stray-branch' });
    await git.createBranchAt({ repoPath, branchName: strayBranch });

    const worktreeValue = `${testbed.guildPath}/worktrees/weqb-drift-11112222`;
    const worktreePath = AbsoluteFilePathStub({ value: worktreeValue });
    const branchName = QuestBranchNameStub({ value: 'quest/weqb-drift-11112222' });
    await gitWorktreeAddAdapter({
      cwd: repoPath,
      worktreePath,
      branchName,
      baseBranch: BaseBranchNameStub({ value: 'main' }),
    });
    await git.checkoutBranch({ repoPath: worktreePath, branchName: strayBranch });

    const branchBefore = await git.gitCurrentBranchName({ repoPath: worktreePath });

    const result = await worktreeEnsureQuestBranchBroker({
      quest: QuestStub({
        id: QuestIdStub({ value: 'weqb-drift-quest' }),
        branchName,
        worktreePath,
      }),
      cwdResolution: QuestCwdResolutionStub({
        kind: 'worktree',
        cwd: RepoRootCwdStub({ value: worktreeValue }),
      }),
      trigger: QuestResumeTriggerStub({ value: 'dispatch-scan' }),
    });

    const branchAfter = await git.gitCurrentBranchName({ repoPath: worktreePath });

    testbed.cleanup();

    expect({ branchBefore, result, branchAfter }).toStrictEqual({
      branchBefore: strayBranch,
      result: { attempted: true, restored: true },
      branchAfter: branchName,
    });
  }, 30_000);

  it('VALID: {identically drifted worktree, kind: repo-root} => the broker leaves the stray branch exactly where it was', async () => {
    // The non-vacuous half of the negative: the SAME real drift as the case above, so "no checkout
    // ran" is a claim about this broker's gate rather than about a fixture that could never have
    // moved anyway.
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'weqb-skip' }),
    });
    const repoPath = AbsoluteFilePathStub({ value: testbed.guildPath });

    await git.initRepoWithPackages({
      repoPath,
      initialBranchName: FileNameStub({ value: 'main' }),
      packageNames: [FileNameStub({ value: 'shared' })],
    });
    const strayBranch = FileNameStub({ value: 'stray-branch' });
    await git.createBranchAt({ repoPath, branchName: strayBranch });

    const worktreeValue = `${testbed.guildPath}/worktrees/weqb-skip-33334444`;
    const worktreePath = AbsoluteFilePathStub({ value: worktreeValue });
    const branchName = QuestBranchNameStub({ value: 'quest/weqb-skip-33334444' });
    await gitWorktreeAddAdapter({
      cwd: repoPath,
      worktreePath,
      branchName,
      baseBranch: BaseBranchNameStub({ value: 'main' }),
    });
    await git.checkoutBranch({ repoPath: worktreePath, branchName: strayBranch });

    const result = await worktreeEnsureQuestBranchBroker({
      quest: QuestStub({
        id: QuestIdStub({ value: 'weqb-skip-quest' }),
        branchName,
        worktreePath,
      }),
      cwdResolution: QuestCwdResolutionStub({
        kind: 'repo-root',
        cwd: RepoRootCwdStub({ value: repoPath }),
      }),
      trigger: QuestResumeTriggerStub({ value: 'dispatch-scan' }),
    });

    const branchAfter = await git.gitCurrentBranchName({ repoPath: worktreePath });

    testbed.cleanup();

    expect({ result, branchAfter }).toStrictEqual({
      result: { attempted: false, restored: false },
      branchAfter: strayBranch,
    });
  }, 30_000);

  it('EDGE: {non-ASCII quest branch name, worktree directory carrying spaces and parens} => the exact name is what the worktree ends up on', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'weqb-hostile' }),
    });
    const repoPath = AbsoluteFilePathStub({ value: testbed.guildPath });

    await git.initRepoWithPackages({
      repoPath,
      initialBranchName: FileNameStub({ value: 'main' }),
      packageNames: [FileNameStub({ value: 'shared' })],
    });
    const strayBranch = FileNameStub({ value: 'stray-branch' });
    await git.createBranchAt({ repoPath, branchName: strayBranch });

    const worktreeValue = `${testbed.guildPath}/worktrees/weqb hostile (dir)-55556666`;
    const worktreePath = AbsoluteFilePathStub({ value: worktreeValue });
    // Hostile fixture member, kept to what git will actually accept as a ref: non-ASCII plus the
    // punctuation `git check-ref-format` allows mid-segment. The DIRECTORY carries the spaces and
    // parentheses instead, so both the cwd and the branch argument have to survive argv unquoted.
    const branchName = QuestBranchNameStub({
      value: 'quest/ütf8-ünïcode+dots.and_underscores-55556666',
    });
    await gitWorktreeAddAdapter({
      cwd: repoPath,
      worktreePath,
      branchName,
      baseBranch: BaseBranchNameStub({ value: 'main' }),
    });
    await git.checkoutBranch({ repoPath: worktreePath, branchName: strayBranch });

    const result = await worktreeEnsureQuestBranchBroker({
      quest: QuestStub({
        id: QuestIdStub({ value: 'weqb-hostile-quest' }),
        branchName,
        worktreePath,
      }),
      cwdResolution: QuestCwdResolutionStub({
        kind: 'worktree',
        cwd: RepoRootCwdStub({ value: worktreeValue }),
      }),
      trigger: QuestResumeTriggerStub({ value: 'orchestration-resume' }),
    });

    const branchAfter = await git.gitCurrentBranchName({ repoPath: worktreePath });

    testbed.cleanup();

    expect({ result, branchAfter }).toStrictEqual({
      result: { attempted: true, restored: true },
      branchAfter: 'quest/ütf8-ünïcode+dots.and_underscores-55556666',
    });
  }, 30_000);
});
