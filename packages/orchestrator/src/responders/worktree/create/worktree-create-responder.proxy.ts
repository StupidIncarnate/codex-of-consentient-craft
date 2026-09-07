import {
  cwdResolveBrokerProxy,
  locationsWorktreePathFindBrokerProxy,
  processCwdAdapterProxy,
} from '@dungeonmaster/shared/testing';
import {
  BaseBranchNameStub,
  QuestBranchNameStub,
  filePathContract,
  type AbsoluteFilePath,
} from '@dungeonmaster/shared/contracts';

import { fsIsAccessibleAdapterProxy } from '../../../adapters/fs/is-accessible/fs-is-accessible-adapter.proxy';
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
  setupNoBaseBranch: () => void;
  setupLeakingLink: (params: {
    repoRoot: AbsoluteFilePath;
    worktreePath: AbsoluteFilePath;
    entryName: string;
    storedTarget: string;
  }) => void;
  getGitArgsList: () => readonly unknown[];
} => {
  const cwdProxy = processCwdAdapterProxy();
  const cwdResolveProxy = cwdResolveBrokerProxy();
  const isAccessibleProxy = fsIsAccessibleAdapterProxy();
  // "Nothing is on disk" is the honest default for a worktree nobody described — which is what
  // makes a fresh carve the default scenario rather than something a test has to spell out.
  isAccessibleProxy.defaultsToNotFound();
  const detectBaseBranchProxy = gitDetectBaseBranchBrokerProxy();
  const prepareProxy = worktreePrepareBrokerProxy();
  const provisionProxy = worktreeProvisionBrokerProxy();
  // Wired to satisfy enforce-proxy-child-creation and left UNADDRESSED: it stages nothing of its
  // own, so every worktree path a test names must match Node's real path.join output.
  locationsWorktreePathFindBrokerProxy();

  const stageRepoRoot = ({ repoRoot }: { repoRoot: AbsoluteFilePath }): void => {
    cwdProxy.returns({ path: String(repoRoot) });
    cwdResolveProxy.setupRepoRootFoundAtStart({ startPath: String(repoRoot) });
  };

  return {
    setupRepoRoot: stageRepoRoot,

    setupFreshCarve: ({ repoRoot, worktreePath, name, sha }): void => {
      stageRepoRoot({ repoRoot });
      detectBaseBranchProxy.setupMainExists();
      prepareProxy.setupHappyPath({
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
      isAccessibleProxy.resolves({ filePath: filePathContract.parse(worktreePath) });
    },

    setupNoBaseBranch: (): void => {
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
