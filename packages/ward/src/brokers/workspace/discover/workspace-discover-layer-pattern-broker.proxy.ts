import { AbsoluteFilePathStub, filePathContract } from '@dungeonmaster/shared/contracts';

import { fsReaddirDirsAdapterProxy } from '../../../adapters/fs/readdir-dirs/fs-readdir-dirs-adapter.proxy';
import { workspaceDiscoverLayerReadBrokerProxy } from './workspace-discover-layer-read-broker.proxy';

// Every caller (workspace-discover-layer-pattern-broker.test.ts and
// workspace-discover-broker.proxy.ts, which composes this one) resolves patterns against rootPath
// '/project' with the base directory 'packages' — the only glob pattern exercised is 'packages/*'.
const ROOT_PATH = AbsoluteFilePathStub({ value: '/project' });
const PACKAGES_DIR = filePathContract.parse(`${ROOT_PATH}/packages`);

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
      readdirProxy.returns({ dirPath: PACKAGES_DIR, dirs });
      dirs.forEach((dir, index) => {
        const name = packageNames[index];
        if (name === undefined) {
          return;
        }
        readProxy.setupReturnsPackage({ fullPath: `${PACKAGES_DIR}/${dir}`, name });
      });
    },

    setupDirectPattern: ({ packageName }: { packageName: string }): void => {
      readProxy.setupReturnsPackage({ fullPath: `${ROOT_PATH}/packages/ward`, name: packageName });
    },

    setupGlobPatternDirFails: (): void => {
      readdirProxy.throws({ dirPath: PACKAGES_DIR, error: new Error('ENOENT') });
    },
  };
};
