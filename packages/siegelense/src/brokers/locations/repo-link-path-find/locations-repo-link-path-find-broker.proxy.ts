import {
  cwdResolveBrokerProxy,
  processCwdAdapterProxy,
  pathJoinAdapterProxy,
  fsExistsSyncAdapterProxy,
} from '@dungeonmaster/shared/testing';
import type { FilePath } from '@dungeonmaster/shared/contracts';

import { locationsRootPathFindBrokerProxy } from '../root-path-find/locations-root-path-find-broker.proxy';
import { fsRealpathAdapterProxy } from '../../../adapters/fs/realpath/fs-realpath-adapter.proxy';

export const locationsRepoLinkPathFindBrokerProxy = (): {
  setupLinkResolvesToRoot: (params: {
    cwdPath: string;
    linkPath: FilePath;
    homeDir: string;
    homePath: FilePath;
    rootPath: FilePath;
  }) => void;
  setupLinkAbsent: (params: { cwdPath: string; linkPath: FilePath }) => void;
  setupLinkPointsElsewhere: (params: {
    cwdPath: string;
    linkPath: FilePath;
    homeDir: string;
    homePath: FilePath;
    rootPath: FilePath;
    elsewhereTarget: string;
  }) => void;
} => {
  const cwdProxy = processCwdAdapterProxy();
  const resolveProxy = cwdResolveBrokerProxy();
  const pathJoinProxy = pathJoinAdapterProxy();
  const existsProxy = fsExistsSyncAdapterProxy();
  const rootPathProxy = locationsRootPathFindBrokerProxy();
  const realpathProxy = fsRealpathAdapterProxy();

  return {
    setupLinkResolvesToRoot: ({
      cwdPath,
      linkPath,
      homeDir,
      homePath,
      rootPath,
    }: {
      cwdPath: string;
      linkPath: FilePath;
      homeDir: string;
      homePath: FilePath;
      rootPath: FilePath;
    }): void => {
      cwdProxy.returns({ path: cwdPath });
      resolveProxy.setupRepoRootFoundAtStart({ startPath: cwdPath });
      pathJoinProxy.returns({ result: linkPath });
      existsProxy.returns({ filePath: linkPath, result: true });
      rootPathProxy.setupRootPath({ homeDir, homePath, rootPath });
      realpathProxy.resolves({ filePath: linkPath, resolvedPath: rootPath });
    },

    setupLinkAbsent: ({ cwdPath, linkPath }: { cwdPath: string; linkPath: FilePath }): void => {
      cwdProxy.returns({ path: cwdPath });
      resolveProxy.setupRepoRootFoundAtStart({ startPath: cwdPath });
      pathJoinProxy.returns({ result: linkPath });
      existsProxy.returns({ filePath: linkPath, result: false });
    },

    setupLinkPointsElsewhere: ({
      cwdPath,
      linkPath,
      homeDir,
      homePath,
      rootPath,
      elsewhereTarget,
    }: {
      cwdPath: string;
      linkPath: FilePath;
      homeDir: string;
      homePath: FilePath;
      rootPath: FilePath;
      elsewhereTarget: string;
    }): void => {
      cwdProxy.returns({ path: cwdPath });
      resolveProxy.setupRepoRootFoundAtStart({ startPath: cwdPath });
      pathJoinProxy.returns({ result: linkPath });
      existsProxy.returns({ filePath: linkPath, result: true });
      rootPathProxy.setupRootPath({ homeDir, homePath, rootPath });
      realpathProxy.resolves({ filePath: linkPath, resolvedPath: elsewhereTarget });
    },
  };
};
