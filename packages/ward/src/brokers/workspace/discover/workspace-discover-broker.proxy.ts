import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { workspaceDiscoverLayerPatternBrokerProxy } from './workspace-discover-layer-pattern-broker.proxy';

export const workspaceDiscoverBrokerProxy = (): {
  setupMultiPackage: (params: {
    patterns: string[];
    dirs: string[];
    packageNames: string[];
  }) => void;
  setupSinglePackage: () => void;
  setupNoPackageJson: () => void;
} => {
  const readProxy = fsReadFileAdapterProxy();
  const patternProxy = workspaceDiscoverLayerPatternBrokerProxy();

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
        content: JSON.stringify({ name: 'root', workspaces: patterns }),
      });
      patternProxy.setupGlobPattern({ dirs, packageNames });
    },

    setupSinglePackage: (): void => {
      readProxy.returns({
        content: JSON.stringify({ name: 'my-package' }),
      });
    },

    setupNoPackageJson: (): void => {
      readProxy.throws({ error: new Error('ENOENT') });
    },
  };
};
