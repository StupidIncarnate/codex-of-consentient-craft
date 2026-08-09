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
// gitWorktreeAddAdapter, gitHeadShaAdapter, worktreePopulateNodeModulesBroker, and
// buildUntilGreenLayerBroker; the existing worktree-prepare-broker.test.ts proves each of those
// was CALLED WITH the right args, never that the real filesystem/git state it produces is correct.
// These four tests drive the actual broker against a throwaway repo built by
// gitWorktreeFixtureHarness and read the resulting git/fs state back.
describe('worktreePrepareBroker (integration) — real git worktree + node_modules + build', () => {
  const git = gitWorktreeFixtureHarness();

  it('VALID: {new worktree off a real 2-package, 2-branch repo, converging build script} => the worktree directory, quest branch, workspace links, third-party deps, bin shims, and built dist all exist for real', async () => {
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

    git.writeWorkspaceNodeModulesFixture({
      repoPath,
      workspacePackages: [FileNameStub({ value: 'shared' }), FileNameStub({ value: 'web' })],
      hoistedDep: {
        packageName: FileNameStub({ value: 'web' }),
        depName: FileNameStub({ value: 'react-router-dom' }),
      },
    });
    const { buildCommand } = git.writeConvergingBuildScript({
      scriptDir: AbsoluteFilePathStub({ value: `${testbed.guildPath}-build-scripts` }),
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
      buildCommand,
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
    const sharedLinkRealpath = git.realpathOf({
      absolutePath: AbsoluteFilePathStub({
        value: `${worktreePath}/node_modules/@dungeonmaster/shared`,
      }),
    });
    const webLinkRealpath = git.realpathOf({
      absolutePath: AbsoluteFilePathStub({
        value: `${worktreePath}/node_modules/@dungeonmaster/web`,
      }),
    });
    const zodPackageJsonExists = git.pathExists({
      absolutePath: AbsoluteFilePathStub({
        value: `${worktreePath}/node_modules/zod/package.json`,
      }),
    });
    const jestShimExecutable = git.isExecutableFile({
      absolutePath: AbsoluteFilePathStub({ value: `${worktreePath}/node_modules/.bin/jest` }),
    });
    const hoistedDepExists = git.pathExists({
      absolutePath: AbsoluteFilePathStub({
        value: `${worktreePath}/packages/web/node_modules/react-router-dom/package.json`,
      }),
    });
    const sharedDistExists = git.pathExists({
      absolutePath: AbsoluteFilePathStub({
        value: `${worktreePath}/packages/shared/dist/contracts.js`,
      }),
    });
    const webDistExists = git.pathExists({
      absolutePath: AbsoluteFilePathStub({ value: `${worktreePath}/packages/web/dist/index.html` }),
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
      sharedLinkRealpath,
      webLinkRealpath,
      zodPackageJsonExists,
      jestShimExecutable,
      hoistedDepExists,
      sharedDistExists,
      webDistExists,
      worktreeListMentionsPath,
    }).toStrictEqual({
      baseRef: mainTipSha,
      questBranchSha: mainTipSha,
      mainTipSha,
      worktreeHeadBranch: branchName,
      worktreeDirExists: true,
      worktreePackagesDirExists: true,
      sharedLinkRealpath: `${worktreePath}/packages/shared`,
      webLinkRealpath: `${worktreePath}/packages/web`,
      zodPackageJsonExists: true,
      jestShimExecutable: true,
      hoistedDepExists: true,
      sharedDistExists: true,
      webDistExists: true,
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

    git.writeWorkspaceNodeModulesFixture({
      repoPath,
      workspacePackages: [FileNameStub({ value: 'shared' }), FileNameStub({ value: 'web' })],
      hoistedDep: {
        packageName: FileNameStub({ value: 'web' }),
        depName: FileNameStub({ value: 'react-router-dom' }),
      },
    });
    const { buildCommand } = git.writeConvergingBuildScript({
      scriptDir: AbsoluteFilePathStub({ value: `${testbed.guildPath}-build-scripts` }),
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
      buildCommand,
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

  it('ERROR: {build command always fails} => the worktree directory and quest branch are both rolled back, and git worktree list no longer mentions the path', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'wpb-rollback' }),
    });
    const repoPath = AbsoluteFilePathStub({ value: testbed.guildPath });

    await git.initRepoWithPackages({
      repoPath,
      initialBranchName: FileNameStub({ value: 'main' }),
      packageNames: [FileNameStub({ value: 'shared' }), FileNameStub({ value: 'web' })],
    });
    git.writeWorkspaceNodeModulesFixture({
      repoPath,
      workspacePackages: [FileNameStub({ value: 'shared' }), FileNameStub({ value: 'web' })],
      hoistedDep: {
        packageName: FileNameStub({ value: 'web' }),
        depName: FileNameStub({ value: 'react-router-dom' }),
      },
    });
    const { buildCommand } = git.writeFailingBuildScript({
      scriptDir: AbsoluteFilePathStub({ value: `${testbed.guildPath}-build-scripts` }),
    });

    const worktreePath = AbsoluteFilePathStub({
      value: `${testbed.guildPath}/worktrees/rollback-66667777`,
    });
    const branchName = QuestBranchNameStub({ value: 'quest/rollback-66667777' });
    const baseBranch = BaseBranchNameStub({ value: 'main' });

    const thrown: unknown = await worktreePrepareBroker({
      repoRoot: repoPath,
      worktreePath,
      branchName,
      baseBranch,
      buildCommand,
    }).catch((error: unknown) => error);

    const worktreeDirExists = git.pathExists({ absolutePath: worktreePath });
    const branchStillExists = await git.gitRevParseOrNull({
      repoPath,
      ref: ErrorMessageStub({ value: branchName }),
    });
    const worktreeListOutput = await git.gitWorktreeListOutput({ repoPath });
    const worktreeListMentionsPath = worktreeListOutput.includes(String(worktreePath));

    testbed.cleanup();

    expect({
      errorName: (thrown as Error).name,
      worktreeDirExists,
      branchStillExists,
      worktreeListMentionsPath,
    }).toStrictEqual({
      errorName: 'WorktreePrepareError',
      worktreeDirExists: false,
      branchStillExists: null,
      worktreeListMentionsPath: false,
    });
  }, 30_000);

  it('ERROR: {branch name already taken by other work} => the existing branch tip is unchanged by the rejected prepare call', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'wpb-name-taken' }),
    });
    const repoPath = AbsoluteFilePathStub({ value: testbed.guildPath });

    await git.initRepoWithPackages({
      repoPath,
      initialBranchName: FileNameStub({ value: 'main' }),
      packageNames: [FileNameStub({ value: 'shared' }), FileNameStub({ value: 'web' })],
    });

    const branchName = QuestBranchNameStub({ value: 'quest/taken-88889999' });
    const baseBranch = BaseBranchNameStub({ value: 'main' });
    // A branch of this exact name is already owned by other work — created independently of
    // this prepare call, the way a second Start for the same slug would find it.
    await git.createBranchAt({
      repoPath,
      branchName: FileNameStub({ value: 'quest/taken-88889999' }),
    });
    const existingBranchShaBefore = await git.gitRevParseOrNull({
      repoPath,
      ref: ErrorMessageStub({ value: branchName }),
    });

    const worktreePath = AbsoluteFilePathStub({
      value: `${testbed.guildPath}/worktrees/taken-88889999`,
    });

    const thrown: unknown = await worktreePrepareBroker({
      repoRoot: repoPath,
      worktreePath,
      branchName,
      baseBranch,
      buildCommand: 'true',
    }).catch((error: unknown) => error);

    const existingBranchShaAfter = await git.gitRevParseOrNull({
      repoPath,
      ref: ErrorMessageStub({ value: branchName }),
    });

    testbed.cleanup();

    expect({
      errorName: (thrown as Error).name,
      existingBranchShaAfter,
    }).toStrictEqual({
      errorName: 'WorktreePrepareError',
      existingBranchShaAfter: existingBranchShaBefore,
    });
  }, 30_000);
});
