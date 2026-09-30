import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';

import { patternResolveLayerBrokerProxy } from './pattern-resolve-layer-broker.proxy';

export const workspaceDiscoverBrokerProxy = (): {
  setupMultiPackage: (params: {
    patterns: string[];
    dirs: string[];
    packageNames: string[];
  }) => void;
  setupSinglePackage: () => void;
  setupNoPackageJson: () => void;
} => {
  const readProxy = readFileProxy();
  const patternProxy = patternResolveLayerBrokerProxy();

  // Every caller (workspace-discover-broker.test.ts, command-run-broker.proxy.ts) resolves the
  // root package.json for rootPath '/project'.
  const path = `${'/project'}/package.json`;

  return {
    setupMultiPackage: ({
      patterns,
      dirs,
      packageNames,
    }: {
      patterns: string[];
      dirs: string[];
      packageNames: string[];
    }): void => {
      readProxy.returns({
        path,
        contents: JSON.stringify({ name: 'root', workspaces: patterns }),
      });
      patternProxy.setupGlobPattern({ dirs, packageNames });
    },

    setupSinglePackage: (): void => {
      readProxy.returns({
        path,
        contents: JSON.stringify({ name: 'my-package' }),
      });
    },

    setupNoPackageJson: (): void => {
      readProxy.missing({ path });
    },
  };
};
