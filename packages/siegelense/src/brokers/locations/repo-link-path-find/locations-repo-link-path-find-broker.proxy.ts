import { join } from 'path';

import {
  cwdResolveBrokerProxy,
  processCwdAdapterProxy,
  pathJoinAdapterProxy,
  fsExistsSyncAdapterProxy,
} from '@dungeonmaster/shared/testing';
import type { FilePath } from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';

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
  // The address for path.join is its SEGMENTS (see packages/testing/CLAUDE.md), but the shared
  // pathJoinAdapterProxy stays on a no-args catch-all because dozens of composing proxies share it
  // with no single caller-known segment list. registerMock keys on the `join` function reference,
  // so a second registration here reads the SAME call history the shared proxy already records —
  // this is the only way this broker's own test can prove which segments IT composed.
  getJoinedSegments: () => unknown;
} => {
  const cwdProxy = processCwdAdapterProxy();
  const resolveProxy = cwdResolveBrokerProxy();
  const pathJoinProxy = pathJoinAdapterProxy();
  const existsProxy = fsExistsSyncAdapterProxy();
  const rootPathProxy = locationsRootPathFindBrokerProxy();
  const realpathProxy = fsRealpathAdapterProxy();
  const joinHandle = registerMock({ fn: join });

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

    // callsMatching([]) hands back a RecordedCalls with no `.at()` (see mock-handle-contract.ts) —
    // spreading it into a real array is how an unaddressed read is meant to inspect "the whole
    // list" here, since this broker makes exactly one join() call per invocation.
    getJoinedSegments: (): unknown => [...joinHandle.callsMatching([])].at(-1),
  };
};
