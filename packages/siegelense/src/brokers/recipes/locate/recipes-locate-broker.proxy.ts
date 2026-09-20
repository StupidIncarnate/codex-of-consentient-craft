import {
  processCwdAdapterProxy,
  cwdResolveBrokerProxy,
  pathJoinAdapterProxy,
  fsExistsSyncAdapterProxy,
} from '@dungeonmaster/shared/testing';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export const recipesLocateBrokerProxy = (): {
  setupPresentAndBuilt: (params: {
    cwdPath: string;
    packagePath: FilePath;
    entryPath: FilePath;
  }) => void;
  setupPresentAndBuiltAt: (params: { packagePath: FilePath; entryPath: FilePath }) => void;
  setupPackageMissing: (params: { cwdPath: string; packagePath: FilePath }) => void;
  setupBuildMissing: (params: {
    cwdPath: string;
    packagePath: FilePath;
    entryPath: FilePath;
  }) => void;
} => {
  const cwdProxy = processCwdAdapterProxy();
  const resolveProxy = cwdResolveBrokerProxy();
  const joinProxy = pathJoinAdapterProxy();
  const existsProxy = fsExistsSyncAdapterProxy();

  return {
    setupPresentAndBuilt: ({
      cwdPath,
      packagePath,
      entryPath,
    }: {
      cwdPath: string;
      packagePath: FilePath;
      entryPath: FilePath;
    }): void => {
      cwdProxy.returns({ path: cwdPath });
      resolveProxy.setupRepoRootFoundAtStart({ startPath: cwdPath });
      joinProxy.returns({ result: packagePath });
      joinProxy.returns({ result: entryPath });
      existsProxy.returns({ filePath: packagePath, result: true });
      existsProxy.returns({ filePath: entryPath, result: true });
    },

    setupPresentAndBuiltAt: ({
      packagePath,
      entryPath,
    }: {
      packagePath: FilePath;
      entryPath: FilePath;
    }): void => {
      existsProxy.returns({ filePath: packagePath, result: true });
      existsProxy.returns({ filePath: entryPath, result: true });
    },

    setupPackageMissing: ({
      cwdPath,
      packagePath,
    }: {
      cwdPath: string;
      packagePath: FilePath;
    }): void => {
      cwdProxy.returns({ path: cwdPath });
      resolveProxy.setupRepoRootFoundAtStart({ startPath: cwdPath });
      joinProxy.returns({ result: packagePath });
      existsProxy.returns({ filePath: packagePath, result: false });
    },

    setupBuildMissing: ({
      cwdPath,
      packagePath,
      entryPath,
    }: {
      cwdPath: string;
      packagePath: FilePath;
      entryPath: FilePath;
    }): void => {
      cwdProxy.returns({ path: cwdPath });
      resolveProxy.setupRepoRootFoundAtStart({ startPath: cwdPath });
      joinProxy.returns({ result: packagePath });
      joinProxy.returns({ result: entryPath });
      existsProxy.returns({ filePath: packagePath, result: true });
      existsProxy.returns({ filePath: entryPath, result: false });
    },
  };
};
