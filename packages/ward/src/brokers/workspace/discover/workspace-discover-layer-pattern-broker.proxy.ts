import { fsReaddirDirsAdapterProxy } from '../../../adapters/fs/readdir-dirs/fs-readdir-dirs-adapter.proxy';
import { workspaceDiscoverLayerReadBrokerProxy } from './workspace-discover-layer-read-broker.proxy';

export const workspaceDiscoverLayerPatternBrokerProxy = (): {
  setupGlobPattern: (params: { dirs: string[]; packageNames: string[] }) => void;
  setupDirectPattern: (params: { packageName: string }) => void;
  setupGlobPatternDirFails: () => void;
} => {
  const readdirProxy = fsReaddirDirsAdapterProxy();
  const readProxy = workspaceDiscoverLayerReadBrokerProxy();

  return {
    setupGlobPattern: ({
      dirs,
      packageNames,
    }: {
      dirs: string[];
      packageNames: string[];
    }): void => {
      readdirProxy.returns({ dirs });
      packageNames.forEach((name) => {
        readProxy.setupReturnsPackage({ name });
      });
    },

    setupDirectPattern: ({ packageName }: { packageName: string }): void => {
      readProxy.setupReturnsPackage({ name: packageName });
    },

    setupGlobPatternDirFails: (): void => {
      readdirProxy.throws({ error: new Error('ENOENT') });
    },
  };
};
