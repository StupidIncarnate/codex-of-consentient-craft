import { type BaseBranchName } from '@dungeonmaster/shared/contracts';

import { headShaProxy } from '#gateway/bin/git/head-sha/head-sha.proxy';
import { verifyRefProxy } from '#gateway/bin/git/verify-ref/verify-ref.proxy';
import { worktreeAddProxy } from '#gateway/bin/git/worktree-add/worktree-add.proxy';
import { worktreePruneProxy } from '#gateway/bin/git/worktree-prune/worktree-prune.proxy';
import { worktreeDiscardBrokerProxy } from '../discard/worktree-discard-broker.proxy';
import { worktreeSeedDistBrokerProxy } from '../seed-dist/worktree-seed-dist-broker.proxy';
import { worktreeVerifyLinksBrokerProxy } from '../verify-links/worktree-verify-links-broker.proxy';

// Every git call is staged by its exact argv through the gateway's own proxies, so each outcome is
// independent of the others with no call-order sequencing. The read-back concatenates each proxy's
// own calls in the order the broker makes them.
const extractArgs = (call: readonly unknown[]): readonly unknown[] => {
  const [first] = call;
  if (typeof first === 'object' && first !== null && 'args' in first) {
    return Array.isArray(first.args) ? first.args : [];
  }
  return [];
};

const isString = (arg: unknown): boolean => typeof arg === 'string';

const NOT_A_REPO_OUTPUT = 'fatal: not a git repository';

export const worktreePrepareBrokerProxy = (): {
  setupHappyPath: (params: {
    repoRoot: string;
    worktreePath: string;
    branchName: string;
    baseBranch: BaseBranchName;
    sha: string;
  }) => void;
  setupAttachExistingBranch: (params: {
    repoRoot: string;
    worktreePath: string;
    branchName: string;
    sha: string;
  }) => void;
  setupAttachExistingBranchHeadShaFails: (params: {
    worktreePath: string;
    branchName: string;
  }) => void;
  setupWorktreeAddFails: (params: {
    worktreePath: string;
    branchName: string;
    baseBranch: BaseBranchName;
    output: string;
  }) => void;
  setupHeadShaFailsDiscardSucceeds: (params: {
    worktreePath: string;
    branchName: string;
    baseBranch: BaseBranchName;
  }) => void;
  setupHeadShaFailsDiscardAlsoFails: (params: {
    worktreePath: string;
    branchName: string;
    baseBranch: BaseBranchName;
    removeFailureOutput: string;
  }) => void;
  setupUnbuiltMainCheckout: (params: {
    repoRoot: string;
    worktreePath: string;
    packageName: string;
  }) => void;
  setupDistSeeded: (params: {
    repoRoot: string;
    worktreePath: string;
    packageName: string;
  }) => void;
  setupLeakingLink: (params: {
    worktreePath: string;
    entryName: string;
    storedTarget: string;
  }) => void;
  getSeedCopyArgs: () => unknown;
  getSpawnedArgsList: () => readonly unknown[];
} => {
  const verifyProxy = verifyRefProxy();
  const addProxy = worktreeAddProxy();
  const pruneProxy = worktreePruneProxy();
  const headProxy = headShaProxy();
  const discardProxy = worktreeDiscardBrokerProxy();
  // These two run REAL from this proxy's point of view, so their own I/O is what gets staged. A
  // scenario that reaches them and describes neither reads as "nothing on disk": no `packages/` to
  // seed from, and no `node_modules` to audit yet.
  const seedProxy = worktreeSeedDistBrokerProxy();
  const linksProxy = worktreeVerifyLinksBrokerProxy();

  // The create-vs-attach mode probe, staged per scenario because the ref it names is only known
  // once a setup method hands its branchName over.
  const stageBranchMissing = ({ branchName }: { branchName: string }): void => {
    verifyProxy.setupResult({ ref: String(branchName), exitCode: 128 });
  };

  const stageAddSucceeds = ({
    worktreePath,
    branchName,
    baseBranch,
  }: {
    worktreePath: string;
    branchName: string;
    baseBranch: BaseBranchName;
  }): void => {
    stageBranchMissing({ branchName });
    addProxy.setupCreateBranch({
      worktreePath: String(worktreePath),
      branchName: String(branchName),
      baseBranch,
      exitCode: 0,
      output: '',
    });
  };

  const stageAttachSucceeds = ({
    worktreePath,
    branchName,
  }: {
    worktreePath: string;
    branchName: string;
  }): void => {
    verifyProxy.setupResult({ ref: String(branchName), exitCode: 0 });
    pruneProxy.setupResult({ exitCode: 0, output: '' });
    addProxy.setupAttachExisting({
      worktreePath: String(worktreePath),
      branchName: String(branchName),
      exitCode: 0,
      output: '',
    });
  };

  const stageNothingOnDisk = ({
    repoRoot,
    worktreePath,
  }: {
    repoRoot: string;
    worktreePath: string;
  }): void => {
    seedProxy.setupPackagesDirAbsent({ repoRoot });
    linksProxy.setupNodeModulesAbsent({ worktreePath });
  };

  const stageHeadShaFails = (): void => {
    headProxy.setupResult({ exitCode: 128, output: NOT_A_REPO_OUTPUT });
  };

  return {
    setupHappyPath: ({ repoRoot, worktreePath, branchName, baseBranch, sha }): void => {
      stageNothingOnDisk({ repoRoot, worktreePath });
      stageAddSucceeds({ worktreePath, branchName, baseBranch });
      headProxy.setupResult({ exitCode: 0, output: `${sha}\n` });
    },

    // The recoverable re-carve: the branch already resolves, so the broker prunes git's stale
    // registration and attaches WITHOUT `-b`.
    setupAttachExistingBranch: ({ repoRoot, worktreePath, branchName, sha }): void => {
      stageNothingOnDisk({ repoRoot, worktreePath });
      stageAttachSucceeds({ worktreePath, branchName });
      headProxy.setupResult({ exitCode: 0, output: `${sha}\n` });
    },

    setupAttachExistingBranchHeadShaFails: ({ worktreePath, branchName }): void => {
      stageAttachSucceeds({ worktreePath, branchName });
      stageHeadShaFails();
    },

    setupWorktreeAddFails: ({ worktreePath, branchName, baseBranch, output }): void => {
      stageBranchMissing({ branchName });
      addProxy.setupCreateBranch({
        worktreePath: String(worktreePath),
        branchName: String(branchName),
        baseBranch,
        exitCode: 128,
        output,
      });
    },

    setupHeadShaFailsDiscardSucceeds: ({ worktreePath, branchName, baseBranch }): void => {
      stageAddSucceeds({ worktreePath, branchName, baseBranch });
      stageHeadShaFails();
      discardProxy.setupBothSucceed({ worktreePath, branchName });
    },

    setupHeadShaFailsDiscardAlsoFails: ({
      worktreePath,
      branchName,
      baseBranch,
      removeFailureOutput,
    }): void => {
      stageAddSucceeds({ worktreePath, branchName, baseBranch });
      stageHeadShaFails();
      discardProxy.setupRemoveFails({ worktreePath, output: removeFailureOutput });
    },

    setupUnbuiltMainCheckout: ({ repoRoot, worktreePath, packageName }): void => {
      seedProxy.setupPackages({
        repoRoot,
        worktreePath,
        packages: [{ name: packageName, hasSourceDist: false, hasTargetDist: false }],
      });
    },

    setupDistSeeded: ({ repoRoot, worktreePath, packageName }): void => {
      seedProxy.setupPackages({
        repoRoot,
        worktreePath,
        packages: [{ name: packageName, hasSourceDist: true, hasTargetDist: false }],
      });
      seedProxy.setupCopySucceeds();
    },

    setupLeakingLink: ({ worktreePath, entryName, storedTarget }): void => {
      linksProxy.setupNodeModulesPresent({ worktreePath });
      linksProxy.setupDirectoryEntries({
        dirPath: `${String(worktreePath)}/node_modules`,
        entries: [{ name: entryName, isDir: false, isSymlink: true }],
      });
      linksProxy.setupReadlinkTarget({
        linkPath: `${String(worktreePath)}/node_modules/${entryName}`,
        target: storedTarget,
      });
    },

    getSeedCopyArgs: (): unknown => seedProxy.getCopyArgs(),

    getSpawnedArgsList: (): readonly unknown[] => [
      ...verifyProxy.getCallsFor({ ref: isString }).map(extractArgs),
      ...pruneProxy.getCallsFor().map(extractArgs),
      ...addProxy.getCallsFor().map(extractArgs),
      ...headProxy.getCallsFor().map(extractArgs),
      ...discardProxy.getSpawnedArgsList(),
    ],
  };
};
