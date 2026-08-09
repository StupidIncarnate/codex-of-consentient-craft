import { spawn } from 'child_process';
import { FilePathStub, RepoRootCwdStub } from '@dungeonmaster/shared/contracts';
import type {
  AbsoluteFilePath,
  BaseBranchName,
  QuestBranchName,
  QuestStub,
} from '@dungeonmaster/shared/contracts';
import { dungeonmasterHomeStatics } from '@dungeonmaster/shared/statics';
import {
  locationsWorktreePathFindBrokerProxy,
  pathJoinAdapterProxy,
} from '@dungeonmaster/shared/testing';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { dungeonmasterConfigResolveAdapterProxy } from '../../../adapters/dungeonmaster-config/resolve/dungeonmaster-config-resolve-adapter.proxy';
import { fsIsAccessibleAdapterProxy } from '../../../adapters/fs/is-accessible/fs-is-accessible-adapter.proxy';
import { gitVerifyRefAdapterProxy } from '../../../adapters/git/verify-ref/git-verify-ref-adapter.proxy';
import { gitDetectBaseBranchBrokerProxy } from '../../../brokers/git/detect-base-branch/git-detect-base-branch-broker.proxy';
import { questRepoRootBrokerProxy } from '../../../brokers/quest/repo-root/quest-repo-root-broker.proxy';
import { worktreePrepareBrokerProxy } from '../../../brokers/worktree/prepare/worktree-prepare-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;

// The repo root the composed questRepoRootBrokerProxy resolves to for every test in this file.
// Fixed so every setup method (config startPath, worktree path assertions) agrees on one value
// without threading it through every method signature.
const REPO_ROOT = RepoRootCwdStub({ value: '/repo' });
const CONFIG_START_PATH = FilePathStub({
  value: `/repo/${dungeonmasterHomeStatics.paths.projectConfigFile}`,
});

export const PrepareQuestWorktreeLayerResponderProxy = (): {
  setupQuestFound: (params: { quest: Quest }) => void;
  setupMainExists: () => void;
  setupMasterExists: () => void;
  setupNeitherBaseBranchExists: () => void;
  setupNameAvailable: () => void;
  setupBranchRefTaken: () => void;
  setupWorktreeDirTaken: () => void;
  setupConfigAbsent: () => void;
  setupConfigPresent: (params: { buildCommand: string }) => void;
  setupWorktreePrepared: (params: {
    branchName: QuestBranchName;
    worktreePath: AbsoluteFilePath;
    baseBranch: BaseBranchName;
    buildCommand: string;
    baseRef: string;
  }) => void;
  setupWorktreePrepareFails: (params: {
    branchName: QuestBranchName;
    worktreePath: AbsoluteFilePath;
    baseBranch: BaseBranchName;
    output: string;
  }) => void;
  getSpawnedGitArgsList: () => readonly unknown[];
  getBuildSpawnedArgs: (params: { command: string }) => unknown;
} => {
  // Every git call the layer's own composed brokers/adapters spawn shares this ONE mock — main /
  // master detection (gitDetectBaseBranchBrokerProxy), the branch/worktree collision probe
  // (gitVerifyRefAdapterProxy), and worktree creation (worktreePrepareBrokerProxy) all stage onto
  // the same handle. Full-args descriptions (main/master/worktree-add/rev-parse-HEAD) always
  // out-specify gitVerifyRefAdapterProxy's command-only ['git'] address, so the branch-name probe
  // (the one call none of those describe) is the only one that ever falls to it. See
  // git-detect-base-branch-broker.proxy.ts for the addressing scheme this mirrors.
  const spawnHandle = registerMock({ fn: spawn });
  // Wired to satisfy enforce-proxy-child-creation; its default is a real path.join passthrough,
  // which is what the layer's own startPath computation relies on.
  pathJoinAdapterProxy();
  // Wired to satisfy enforce-proxy-child-creation; locationsWorktreePathFindBroker is pure (it
  // just joins paths for real via pathJoinAdapter above), so nothing is staged on it.
  locationsWorktreePathFindBrokerProxy();
  const repoRootProxy = questRepoRootBrokerProxy();
  const baseBranchProxy = gitDetectBaseBranchBrokerProxy();
  const verifyRefProxy = gitVerifyRefAdapterProxy();
  const isAccessibleProxy = fsIsAccessibleAdapterProxy();
  const configProxy = dungeonmasterConfigResolveAdapterProxy();
  const prepareProxy = worktreePrepareBrokerProxy();

  return {
    setupQuestFound: ({ quest }: { quest: Quest }): void => {
      repoRootProxy.setupQuestFound({ quest });
      repoRootProxy.setupResolveSuccess({ repoRoot: REPO_ROOT });
    },

    setupMainExists: (): void => {
      baseBranchProxy.setupMainExists();
    },

    setupMasterExists: (): void => {
      baseBranchProxy.setupMasterExists();
    },

    setupNeitherBaseBranchExists: (): void => {
      baseBranchProxy.setupNeitherExists();
    },

    // Branch ref missing AND worktree directory missing — the name is free to use.
    setupNameAvailable: (): void => {
      verifyRefProxy.setupMissing();
      isAccessibleProxy.defaultsToNotFound();
    },

    // Branch ref exists; the worktree directory check is independent so it is left at its
    // "missing" default rather than mattering — either half alone is enough to refuse.
    setupBranchRefTaken: (): void => {
      verifyRefProxy.setupExists();
      isAccessibleProxy.defaultsToNotFound();
    },

    // Worktree directory exists, branch ref absent — the other half of the same refusal.
    setupWorktreeDirTaken: (): void => {
      verifyRefProxy.setupMissing();
      isAccessibleProxy.defaultsToFound();
    },

    setupConfigAbsent: (): void => {
      const error = new Error('ConfigNotFoundError: .dungeonmaster.json not found');
      error.name = 'ConfigNotFoundError';
      configProxy.setupConfigResolveError({ startPath: CONFIG_START_PATH, error });
    },

    setupConfigPresent: ({ buildCommand }: { buildCommand: string }): void => {
      configProxy.setupConfigResolved({
        startPath: CONFIG_START_PATH,
        config: configProxy.makeConfigWithArgs({
          devServer: { devCommand: 'npm run dev', port: 3738, buildCommand },
        } as never),
      });
    },

    setupWorktreePrepared: ({
      branchName,
      worktreePath,
      baseBranch,
      buildCommand,
      baseRef,
    }: {
      branchName: QuestBranchName;
      worktreePath: AbsoluteFilePath;
      baseBranch: BaseBranchName;
      buildCommand: string;
      baseRef: string;
    }): void => {
      prepareProxy.setupHappyPath({
        worktreePath,
        branchName,
        baseBranch,
        buildCommand,
        sha: baseRef,
      });
    },

    setupWorktreePrepareFails: ({
      branchName,
      worktreePath,
      baseBranch,
      output,
    }: {
      branchName: QuestBranchName;
      worktreePath: AbsoluteFilePath;
      baseBranch: BaseBranchName;
      output: string;
    }): void => {
      prepareProxy.setupWorktreeAddFails({ worktreePath, branchName, baseBranch, output });
    },

    getSpawnedGitArgsList: (): readonly unknown[] =>
      spawnHandle.callsMatching(['git']).map((call) => call[1]),

    getBuildSpawnedArgs: ({ command }: { command: string }): unknown =>
      prepareProxy.getBuildSpawnedArgs({ command }),
  };
};
