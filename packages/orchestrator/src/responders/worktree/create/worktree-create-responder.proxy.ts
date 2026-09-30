import { cwdResolveBrokerProxy } from '@dungeonmaster/shared/brokers/cwd/resolve/cwd-resolve-broker.proxy';
import { locationsWorktreePathFindBrokerProxy } from '@dungeonmaster/shared/brokers/locations/worktree-path-find/locations-worktree-path-find-broker.proxy';
import { BaseBranchNameStub } from '@dungeonmaster/shared/contracts/base-branch-name/base-branch-name.stub';
import { pathExistsProxy } from '#gateway/node/fs__promises/path-exists/path-exists.proxy';
import { cwdProxy } from '#gateway/node/process/cwd/cwd.proxy';

import { gitDetectBaseBranchBrokerProxy } from '../../../brokers/git/detect-base-branch/git-detect-base-branch-broker.proxy';
import { worktreePrepareBrokerProxy } from '../../../brokers/worktree/prepare/worktree-prepare-broker.proxy';
import { worktreeProvisionBrokerProxy } from '../../../brokers/worktree/provision/worktree-provision-broker.proxy';

export const WorktreeCreateResponderProxy = (): {
  setupRepoRoot: (params: { repoRoot: string }) => void;
  setupFreshCarve: (params: {
    repoRoot: string;
    worktreePath: string;
    name: string;
    sha: string;
  }) => void;
  setupWorktreeAlreadyOnDisk: (params: { worktreePath: string }) => void;
  setupNoBaseBranch: (params: { worktreePath: string }) => void;
  setupLeakingLink: (params: {
    repoRoot: string;
    worktreePath: string;
    entryName: string;
    storedTarget: string;
  }) => void;
  getGitArgsList: () => readonly unknown[];
} => {
  const cwdSetup = cwdProxy();
  const cwdResolveProxy = cwdResolveBrokerProxy();
  const isAccessibleProxy = pathExistsProxy();
  const detectBaseBranchProxy = gitDetectBaseBranchBrokerProxy();
  const prepareProxy = worktreePrepareBrokerProxy();
  const provisionProxy = worktreeProvisionBrokerProxy();
  // Wired to satisfy enforce-proxy-child-creation and left UNADDRESSED: it stages nothing of its
  // own, so every worktree path a test names must match Node's real path.join output.
  locationsWorktreePathFindBrokerProxy();

  const stageRepoRoot = ({ repoRoot }: { repoRoot: string }): void => {
    cwdSetup.setupCwd({ value: repoRoot });
    cwdResolveProxy.setupRepoRootFoundAtStart({ startPath: repoRoot });
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
        branchName: name,
        baseBranch: BaseBranchNameStub({ value: 'main' }),
        sha,
      });
      provisionProxy.setupBareWorktree({ repoRoot, worktreePath });
    },

    // Only the DIRECTORY is described, deliberately: the git step is the one gated on it, while the
    // mirror, the seed and the audit each read their own patch of disk and decide for themselves.
    setupWorktreeAlreadyOnDisk: ({ worktreePath }: { worktreePath: string }): void => {
      isAccessibleProxy.present({ path: worktreePath });
    },

    setupNoBaseBranch: ({ worktreePath }: { worktreePath: string }): void => {
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
