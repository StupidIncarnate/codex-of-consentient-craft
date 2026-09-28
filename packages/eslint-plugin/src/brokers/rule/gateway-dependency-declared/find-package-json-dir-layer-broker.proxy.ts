import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';
import { pathDirnameAdapterProxy } from '../../../adapters/path/dirname/path-dirname-adapter.proxy';

export const findPackageJsonDirLayerBrokerProxy = (): {
  setupPackageJsonAt: (args: { dirPath: string }) => void;
  setupNoPackageJsonAt: (args: { dirPath: string }) => void;
} => {
  const existsProxy = existsSyncProxy();
  // Real passthrough default: no explicit staging.
  pathJoinAdapterProxy();
  pathDirnameAdapterProxy();

  return {
    // Mirrors real path.join's own normalization (the broker joins via pathJoinAdapter, whose
    // default is a real passthrough): a root dirPath ('/') must not double the leading slash.
    setupPackageJsonAt: ({ dirPath }: { dirPath: string }): void => {
      existsProxy.returns({
        path: dirPath.endsWith('/') ? `${dirPath}package.json` : `${dirPath}/package.json`,
        exists: true,
      });
    },

    // existsSyncProxy ships no address-less catch-all: a walk-to-root "nothing found" test stages
    // every ancestor level explicitly false, one call per level.
    setupNoPackageJsonAt: ({ dirPath }: { dirPath: string }): void => {
      existsProxy.returns({
        path: dirPath.endsWith('/') ? `${dirPath}package.json` : `${dirPath}/package.json`,
        exists: false,
      });
    },
  };
};
