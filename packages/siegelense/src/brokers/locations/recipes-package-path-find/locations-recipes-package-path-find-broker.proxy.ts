import {
  cwdResolveBrokerProxy,
  pathJoinAdapterProxy,
  processCwdAdapterProxy,
} from '@dungeonmaster/shared/testing';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export const locationsRecipesPackagePathFindBrokerProxy = (): {
  setupRepoRootAtCwd: (params: { cwdPath: string; packagePath: FilePath }) => void;
  setupRepoRootInParent: (params: {
    cwdPath: string;
    repoRoot: string;
    packagePath: FilePath;
  }) => void;
} => {
  const cwdProxy = processCwdAdapterProxy();
  const resolveProxy = cwdResolveBrokerProxy();
  const pathJoinProxy = pathJoinAdapterProxy();

  return {
    setupRepoRootAtCwd: ({
      cwdPath,
      packagePath,
    }: {
      cwdPath: string;
      packagePath: FilePath;
    }): void => {
      cwdProxy.returns({ path: cwdPath });
      resolveProxy.setupRepoRootFoundAtStart({ startPath: cwdPath });
      pathJoinProxy.returns({ result: packagePath });
    },

    setupRepoRootInParent: ({
      cwdPath,
      repoRoot,
      packagePath,
    }: {
      cwdPath: string;
      repoRoot: string;
      packagePath: FilePath;
    }): void => {
      cwdProxy.returns({ path: cwdPath });
      resolveProxy.setupRepoRootFoundInParent({ startPath: cwdPath, repoRoot });
      pathJoinProxy.returns({ result: packagePath });
    },
  };
};
