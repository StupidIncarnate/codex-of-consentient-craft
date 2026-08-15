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

import { worktreePrepareBroker } from './worktree-prepare-broker';
import { gitWorktreeFixtureHarness } from '../../../../test/harnesses/git-worktree-fixture/git-worktree-fixture.harness';

// Real git + real fs throughout — no adapter is mocked. `worktreePrepareBroker` composes
// gitWorktreeAddAdapter and gitHeadShaAdapter; the existing worktree-prepare-broker.test.ts proves
// each of those was CALLED WITH the right args, never that the real git state it produces is
// correct. These three tests drive the actual broker against a throwaway repo built by
// gitWorktreeFixtureHarness and read the resulting git/fs state back. The node_modules mirror and
// the preflight build have their own integration suites beside their own brokers.
describe('worktreePrepareBroker (integration) — real git worktree creation', () => {
  const git = gitWorktreeFixtureHarness();

  it('VALID: {new worktree off a real 2-branch repo} => the worktree directory and quest branch exist for real, both pinned at the base branch tip', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'wpb-success' }),
    });
    const repoPath = AbsoluteFilePathStub({ value: testbed.guildPath });

    await git.initRepoWithPackages({
      repoPath,
      initialBranchName: FileNameStub({ value: 'main' }),
      packageNames: [FileNameStub({ value: 'shared' }), FileNameStub({ value: 'web' })],
    });
    // A second branch pinned at the FIRST commit, so main can diverge from it below — this is
    // what proves quest-branch-created-at-base-tip reads main's own tip rather than any branch
    // that happens to exist in the repo.
    await git.createBranchAt({ repoPath, branchName: FileNameStub({ value: 'develop' }) });
    const { sha: mainTipSha } = await git.commitFile({
      repoPath,
      relativePath: RepoRelativePathStub({ value: 'README.md' }),
      content: FileContentsStub({ value: '# fixture repo\nsecond commit on main, past develop\n' }),
      message: ErrorMessageStub({ value: 'advance main past develop' }),
    });

    const worktreePath = AbsoluteFilePathStub({
      value: `${testbed.guildPath}/worktrees/add-auth-11112222`,
    });
    const branchName = QuestBranchNameStub({ value: 'quest/add-auth-11112222' });
    const baseBranch = BaseBranchNameStub({ value: 'main' });

    const { baseRef } = await worktreePrepareBroker({
      repoRoot: repoPath,
      worktreePath,
      branchName,
      baseBranch,
    });

    const questBranchSha = await git.gitRevParseOrNull({
      repoPath,
      ref: ErrorMessageStub({ value: branchName }),
    });
    const worktreeHeadBranch = await git.gitCurrentBranchName({ repoPath: worktreePath });
    const worktreeDirExists = git.pathExists({ absolutePath: worktreePath });
    const worktreePackagesDirExists = git.pathExists({
      absolutePath: AbsoluteFilePathStub({ value: `${worktreePath}/packages` }),
    });
    const worktreeListOutput = await git.gitWorktreeListOutput({ repoPath });
    const worktreeListMentionsPath = worktreeListOutput.includes(String(worktreePath));

    testbed.cleanup();

    expect({
      baseRef,
      questBranchSha,
      mainTipSha,
      worktreeHeadBranch,
      worktreeDirExists,
      worktreePackagesDirExists,
      worktreeListMentionsPath,
    }).toStrictEqual({
      baseRef: mainTipSha,
      questBranchSha: mainTipSha,
      mainTipSha,
      worktreeHeadBranch: branchName,
      worktreeDirExists: true,
      worktreePackagesDirExists: true,
      worktreeListMentionsPath: true,
    });
  }, 30_000);

  it('VALID: {repo root checkout has an uncommitted edit before prepare runs} => the worktree gets the COMMITTED contents, not the dirty ones, and starts with an empty status', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'wpb-no-leak' }),
    });
    const repoPath = AbsoluteFilePathStub({ value: testbed.guildPath });

    await git.initRepoWithPackages({
      repoPath,
      initialBranchName: FileNameStub({ value: 'main' }),
      packageNames: [FileNameStub({ value: 'shared' }), FileNameStub({ value: 'web' })],
    });
    const committedReadme = git.readTextFile({
      absolutePath: AbsoluteFilePathStub({ value: `${repoPath}/README.md` }),
    });

    // Left modified-but-uncommitted in the ROOT checkout before the worktree is made — the
    // dirty edit a developer or a running agent could plausibly have sitting around.
    git.dirtyTrackedFile({
      repoPath,
      relativePath: RepoRelativePathStub({ value: 'README.md' }),
      content: FileContentsStub({
        value: '# fixture repo\nUNCOMMITTED — must never reach the worktree\n',
      }),
    });

    const worktreePath = AbsoluteFilePathStub({
      value: `${testbed.guildPath}/worktrees/no-leak-33334444`,
    });
    const branchName = QuestBranchNameStub({ value: 'quest/no-leak-33334444' });
    const baseBranch = BaseBranchNameStub({ value: 'main' });

    await worktreePrepareBroker({
      repoRoot: repoPath,
      worktreePath,
      branchName,
      baseBranch,
    });

    const worktreeReadme = git.readTextFile({
      absolutePath: AbsoluteFilePathStub({ value: `${worktreePath}/README.md` }),
    });
    const worktreeStatus = await git.gitStatusPorcelain({ repoPath: worktreePath });

    testbed.cleanup();

    expect({ worktreeReadme, worktreeStatus }).toStrictEqual({
      worktreeReadme: committedReadme,
      worktreeStatus: '',
    });
  }, 30_000);

  // The recovery case, against real git: the quest's branch already exists (a previous carve made
  // it and holds the quest's commits) but no worktree is checked out against it — the state left
  // behind when someone deletes the worktree directory between attempts. `-b` refuses this outright
  // with "already exists", which is what used to lock the quest out permanently.
  it('VALID: {quest branch already exists with no worktree} => attaches a real worktree to it without moving its tip', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'wpb-reattach' }),
    });
    const repoPath = AbsoluteFilePathStub({ value: testbed.guildPath });

    await git.initRepoWithPackages({
      repoPath,
      initialBranchName: FileNameStub({ value: 'main' }),
      packageNames: [FileNameStub({ value: 'shared' }), FileNameStub({ value: 'web' })],
    });

    const branchName = QuestBranchNameStub({ value: 'quest/reattach-88889999' });
    const baseBranch = BaseBranchNameStub({ value: 'main' });
    await git.createBranchAt({
      repoPath,
      branchName: FileNameStub({ value: 'quest/reattach-88889999' }),
    });
    // main moves on AFTER the quest branch was cut, so a `-b`-style re-fork would visibly land on a
    // different sha than the branch's own tip — which is what makes the assertion below meaningful.
    await git.commitFile({
      repoPath,
      relativePath: RepoRelativePathStub({ value: 'README.md' }),
      content: FileContentsStub({ value: '# fixture repo\nmain advanced past the quest branch\n' }),
      message: ErrorMessageStub({ value: 'advance main past the quest branch' }),
    });
    const existingBranchShaBefore = await git.gitRevParseOrNull({
      repoPath,
      ref: ErrorMessageStub({ value: branchName }),
    });

    const worktreePath = AbsoluteFilePathStub({
      value: `${testbed.guildPath}/worktrees/reattach-88889999`,
    });

    const { baseRef } = await worktreePrepareBroker({
      repoRoot: repoPath,
      worktreePath,
      branchName,
      baseBranch,
    });

    const existingBranchShaAfter = await git.gitRevParseOrNull({
      repoPath,
      ref: ErrorMessageStub({ value: branchName }),
    });
    const worktreeHeadBranch = await git.gitCurrentBranchName({ repoPath: worktreePath });
    const worktreeDirExists = git.pathExists({ absolutePath: worktreePath });

    testbed.cleanup();

    expect({
      baseRef,
      existingBranchShaAfter,
      worktreeHeadBranch,
      worktreeDirExists,
    }).toStrictEqual({
      baseRef: existingBranchShaBefore,
      existingBranchShaAfter: existingBranchShaBefore,
      worktreeHeadBranch: branchName,
      worktreeDirExists: true,
    });
  }, 30_000);
});
