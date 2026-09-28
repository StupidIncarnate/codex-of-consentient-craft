import {
  cwdResolveBrokerProxy,
  locationsWorktreePathFindBrokerProxy,
} from '@dungeonmaster/shared/testing';
import {
  BaseBranchNameStub,
  QuestBranchNameStub,
  type AbsoluteFilePath,
} from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { pathExistsProxy } from '#gateway/node/fs__promises/path-exists/path-exists.proxy';
import { cwdProxy } from '#gateway/node/process/cwd/cwd.proxy';
import { cwd } from '#gateway/node/process';

import { gitDetectBaseBranchBrokerProxy } from '../../../brokers/git/detect-base-branch/git-detect-base-branch-broker.proxy';
import { worktreePrepareBrokerProxy } from '../../../brokers/worktree/prepare/worktree-prepare-broker.proxy';
import { worktreeProvisionBrokerProxy } from '../../../brokers/worktree/provision/worktree-provision-broker.proxy';

export const WorktreeCreateResponderProxy = (): {
  setupRepoRoot: (params: { repoRoot: AbsoluteFilePath }) => void;
  setupFreshCarve: (params: {
    repoRoot: AbsoluteFilePath;
    worktreePath: AbsoluteFilePath;
    name: string;
    sha: string;
  }) => void;
  setupWorktreeAlreadyOnDisk: (params: { worktreePath: AbsoluteFilePath }) => void;
  setupNoBaseBranch: (params: { worktreePath: AbsoluteFilePath }) => void;
  setupLeakingLink: (params: {
    repoRoot: AbsoluteFilePath;
    worktreePath: AbsoluteFilePath;
    entryName: string;
    storedTarget: string;
  }) => void;
  getGitArgsList: () => readonly unknown[];
} => {
  cwdProxy();
  const cwdHandle = registerMock({ fn: cwd });
  const cwdResolveProxy = cwdResolveBrokerProxy();
  const isAccessibleProxy = pathExistsProxy();
  const detectBaseBranchProxy = gitDetectBaseBranchBrokerProxy();
  const prepareProxy = worktreePrepareBrokerProxy();
  const provisionProxy = worktreeProvisionBrokerProxy();
  // Wired to satisfy enforce-proxy-child-creation and left UNADDRESSED: it stages nothing of its
  // own, so every worktree path a test names must match Node's real path.join output.
  locationsWorktreePathFindBrokerProxy();

  const stageRepoRoot = ({ repoRoot }: { repoRoot: AbsoluteFilePath }): void => {
    cwdHandle.calledWith([]).returns(String(repoRoot));
    cwdResolveProxy.setupRepoRootFoundAtStart({ startPath: String(repoRoot) });
  };

  return {
    setupRepoRoot: stageRepoRoot,

    setupFreshCarve: ({ repoRoot, worktreePath, name, sha }): void => {
      stageRepoRoot({ repoRoot });
      isAccessibleProxy.missing({ path: worktreePath });
      detectBaseBranchProxy.setupMainExists();
      prepareProxy.setupHappyPath({
        repoRoot,
        worktreePath,
        branchName: QuestBranchNameStub({ value: name }),
        baseBranch: BaseBranchNameStub({ value: 'main' }),
        sha,
      });
      provisionProxy.setupBareWorktree({ repoRoot, worktreePath });
    },

    // Only the DIRECTORY is described, deliberately: the git step is the one gated on it, while the
    // mirror, the seed and the audit each read their own patch of disk and decide for themselves.
    setupWorktreeAlreadyOnDisk: ({ worktreePath }: { worktreePath: AbsoluteFilePath }): void => {
      isAccessibleProxy.present({ path: worktreePath });
    },

    setupNoBaseBranch: ({ worktreePath }: { worktreePath: AbsoluteFilePath }): void => {
      isAccessibleProxy.missing({ path: worktreePath });
      detectBaseBranchProxy.setupNeitherExists();
    },

    setupLeakingLink: ({ repoRoot, worktreePath, entryName, storedTarget }): void => {
      provisionProxy.setupBareWorktree({ repoRoot, worktreePath });
      provisionProxy.setupMirroredLinkEscapingTheWorktree({
        worktreePath,
        linkName: entryName,
        absoluteTarget: storedTarget,
      });
    },

    getGitArgsList: (): readonly unknown[] => prepareProxy.getSpawnedArgsList(),
  };
};
