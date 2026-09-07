import {
  AbsoluteFilePathStub,
  FilePathStub,
  type AbsoluteFilePath,
} from '@dungeonmaster/shared/contracts';

import { worktreePopulateNodeModulesBrokerProxy } from '../populate-node-modules/worktree-populate-node-modules-broker.proxy';
import { worktreeSeedDistBrokerProxy } from '../seed-dist/worktree-seed-dist-broker.proxy';
import { worktreeVerifyLinksBrokerProxy } from '../verify-links/worktree-verify-links-broker.proxy';

export const worktreeProvisionBrokerProxy = (): {
  setupBareWorktree: (params: {
    repoRoot: AbsoluteFilePath;
    worktreePath: AbsoluteFilePath;
  }) => void;
  setupUnbuiltSourcePackage: (params: {
    repoRoot: AbsoluteFilePath;
    worktreePath: AbsoluteFilePath;
    packageName: string;
  }) => void;
  setupMirroredLinkEscapingTheWorktree: (params: {
    worktreePath: AbsoluteFilePath;
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
    // nothing yet — the shape a first provision meets.
    setupBareWorktree: ({
      repoRoot,
      worktreePath,
    }: {
      repoRoot: AbsoluteFilePath;
      worktreePath: AbsoluteFilePath;
    }): void => {
      populateProxy.setupNoWorkspaceLinks({ repoRoot, worktreePath, thirdPartyEntry: 'zod' });
    },

    // A package whose compiled output the MAIN checkout never produced, which is what the seed step
    // refuses on.
    setupUnbuiltSourcePackage: ({
      repoRoot,
      worktreePath,
      packageName,
    }: {
      repoRoot: AbsoluteFilePath;
      worktreePath: AbsoluteFilePath;
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
      worktreePath: AbsoluteFilePath;
      linkName: string;
      absoluteTarget: string;
    }): void => {
      verifyProxy.setupNodeModulesPresent({ worktreePath });
      verifyProxy.setupDirectoryEntries({
        dirPath: AbsoluteFilePathStub({ value: `${String(worktreePath)}/node_modules` }),
        entries: [{ name: linkName, isDir: false, isSymlink: true }],
      });
      verifyProxy.setupReadlinkTarget({
        linkPath: FilePathStub({ value: `${String(worktreePath)}/node_modules/${linkName}` }),
        target: absoluteTarget,
      });
    },

    getAllCopyArgs: (): readonly unknown[] => populateProxy.getAllCopyArgs(),
  };
};
