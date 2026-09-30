import { worktreePopulateNodeModulesBrokerProxy } from '../populate-node-modules/worktree-populate-node-modules-broker.proxy';
import { worktreeSeedDistBrokerProxy } from '../seed-dist/worktree-seed-dist-broker.proxy';
import { worktreeVerifyLinksBrokerProxy } from '../verify-links/worktree-verify-links-broker.proxy';

export const worktreeProvisionBrokerProxy = (): {
  setupBareWorktree: (params: { repoRoot: string; worktreePath: string }) => void;
  setupUnbuiltSourcePackage: (params: {
    repoRoot: string;
    worktreePath: string;
    packageName: string;
  }) => void;
  setupMirroredLinkEscapingTheWorktree: (params: {
    worktreePath: string;
    linkName: string;
    absoluteTarget: string;
  }) => void;
  getAllCopyArgs: () => readonly unknown[];
} => {
  const populateProxy = worktreePopulateNodeModulesBrokerProxy();
  const seedProxy = worktreeSeedDistBrokerProxy();
  const verifyProxy = worktreeVerifyLinksBrokerProxy();

  return {
    // The source root holds one third-party entry and no workspace links, and the worktree holds
    // nothing yet — the shape a first provision meets. The source has no `packages/` directory, so the
    // dist seed has nothing to copy, and no node_modules stands at the worktree for the audit to walk.
    setupBareWorktree: ({
      repoRoot,
      worktreePath,
    }: {
      repoRoot: string;
      worktreePath: string;
    }): void => {
      populateProxy.setupNoWorkspaceLinks({ repoRoot, worktreePath, thirdPartyEntry: 'zod' });
      seedProxy.setupPackagesDirAbsent({ repoRoot });
    },

    // A package whose compiled output the MAIN checkout never produced, which is what the seed step
    // refuses on.
    setupUnbuiltSourcePackage: ({
      repoRoot,
      worktreePath,
      packageName,
    }: {
      repoRoot: string;
      worktreePath: string;
      packageName: string;
    }): void => {
      seedProxy.setupPackages({
        repoRoot,
        worktreePath,
        packages: [{ name: packageName, hasSourceDist: false, hasTargetDist: false }],
      });
    },

    // A worktree whose node_modules already holds a link pointing back at an absolute path outside
    // it. Staging its entries also makes the mirror read the root as already populated, which is
    // exactly the re-provision the audit exists to catch.
    setupMirroredLinkEscapingTheWorktree: ({
      worktreePath,
      linkName,
      absoluteTarget,
    }: {
      worktreePath: string;
      linkName: string;
      absoluteTarget: string;
    }): void => {
      verifyProxy.setupNodeModulesPresent({ worktreePath });
      verifyProxy.setupDirectoryEntries({
        dirPath: `${worktreePath}/node_modules`,
        entries: [{ name: linkName, isDir: false, isSymlink: true }],
      });
      verifyProxy.setupReadlinkTarget({
        linkPath: `${worktreePath}/node_modules/${linkName}`,
        target: absoluteTarget,
      });
    },

    getAllCopyArgs: (): readonly unknown[] => populateProxy.getAllCopyArgs(),
  };
};
