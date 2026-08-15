import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';
import {
  AbsoluteFilePathStub,
  BaseBranchNameStub,
  ErrorMessageStub,
  FileNameStub,
  QuestBranchNameStub,
} from '@dungeonmaster/shared/contracts';

import { worktreePopulateNodeModulesBroker } from './worktree-populate-node-modules-broker';
import { worktreePrepareBroker } from '../prepare/worktree-prepare-broker';
import { gitWorktreeFixtureHarness } from '../../../../test/harnesses/git-worktree-fixture/git-worktree-fixture.harness';

type StreamedLine = ReturnType<typeof ErrorMessageStub>;

// Real fs throughout — no adapter is mocked. The unit suite proves which symlinks were REQUESTED;
// only this one proves the links that land actually resolve inside the worktree, that a package's
// own hoisted dependencies come across, and that a second run over an already-mirrored tree
// resolves instead of dying on EEXIST — the real-world shape of a `pt N` riftcarver resuming after
// a spiritmender. `worktreePrepareBroker` is used here purely as the PRECONDITION that puts a real
// worktree (with its own `packages/` checkout) on disk to mirror into.
describe('worktreePopulateNodeModulesBroker (integration) — real fs mirroring', () => {
  const git = gitWorktreeFixtureHarness();

  it('VALID: {fresh worktree off a real 2-package repo} => workspace links, third-party deps, bin shims and per-package hoisted deps all exist for real', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'wpnm-fresh' }),
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

    const worktreePath = AbsoluteFilePathStub({
      value: `${testbed.guildPath}/worktrees/mirror-11112222`,
    });
    await worktreePrepareBroker({
      repoRoot: repoPath,
      worktreePath,
      branchName: QuestBranchNameStub({ value: 'quest/mirror-11112222' }),
      baseBranch: BaseBranchNameStub({ value: 'main' }),
    });

    const streamed: StreamedLine[] = [];
    const result = await worktreePopulateNodeModulesBroker({
      repoRoot: repoPath,
      worktreePath,
      onLine: (line): void => {
        streamed.push(ErrorMessageStub({ value: line }));
      },
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

    testbed.cleanup();

    expect({
      result,
      sharedLinkRealpath,
      webLinkRealpath,
      zodPackageJsonExists,
      jestShimExecutable,
      hoistedDepExists,
      streamed,
    }).toStrictEqual({
      result: { success: true },
      sharedLinkRealpath: `${worktreePath}/packages/shared`,
      webLinkRealpath: `${worktreePath}/packages/web`,
      zodPackageJsonExists: true,
      jestShimExecutable: true,
      hoistedDepExists: true,
      streamed: [
        `— mirroring node_modules: ${worktreePath} —`,
        `— mirroring node_modules: ${worktreePath}/packages/web —`,
      ],
    });
  }, 30_000);

  it('VALID: {run twice over the same worktree} => the second run resolves rather than dying on EEXIST, skips every populated root, and leaves the links resolving where they were', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'wpnm-rerun' }),
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

    const worktreePath = AbsoluteFilePathStub({
      value: `${testbed.guildPath}/worktrees/rerun-33334444`,
    });
    await worktreePrepareBroker({
      repoRoot: repoPath,
      worktreePath,
      branchName: QuestBranchNameStub({ value: 'quest/rerun-33334444' }),
      baseBranch: BaseBranchNameStub({ value: 'main' }),
    });

    await worktreePopulateNodeModulesBroker({
      repoRoot: repoPath,
      worktreePath,
      onLine: () => undefined,
    });

    const streamed: StreamedLine[] = [];
    const secondResult = await worktreePopulateNodeModulesBroker({
      repoRoot: repoPath,
      worktreePath,
      onLine: (line): void => {
        streamed.push(ErrorMessageStub({ value: line }));
      },
    });

    const sharedLinkRealpath = git.realpathOf({
      absolutePath: AbsoluteFilePathStub({
        value: `${worktreePath}/node_modules/@dungeonmaster/shared`,
      }),
    });
    const hoistedDepExists = git.pathExists({
      absolutePath: AbsoluteFilePathStub({
        value: `${worktreePath}/packages/web/node_modules/react-router-dom/package.json`,
      }),
    });

    testbed.cleanup();

    expect({
      secondResult,
      sharedLinkRealpath,
      hoistedDepExists,
      streamed,
    }).toStrictEqual({
      secondResult: { success: true },
      sharedLinkRealpath: `${worktreePath}/packages/shared`,
      hoistedDepExists: true,
      streamed: [
        `— skip ${worktreePath} (node_modules already populated) —`,
        `— skip ${worktreePath}/packages/web (node_modules already populated) —`,
      ],
    });
  }, 30_000);
});
