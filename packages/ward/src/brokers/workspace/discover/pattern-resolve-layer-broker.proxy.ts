import { readdirEntriesProxy } from '#gateway/node/fs__promises/readdir-entries/readdir-entries.proxy';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts/absolute-file-path/absolute-file-path.stub';

import { packageReadLayerBrokerProxy } from './package-read-layer-broker.proxy';

// Every caller (pattern-resolve-layer-broker.test.ts and
// workspace-discover-broker.proxy.ts, which composes this one) resolves patterns against rootPath
// '/project' with the base directory 'packages' — the only glob pattern exercised is 'packages/*'.
const ROOT_PATH = AbsoluteFilePathStub({ value: '/project' });
const PACKAGES_DIR = `${ROOT_PATH}/packages`;

export const patternResolveLayerBrokerProxy = (): {
  setupGlobPattern: (params: { dirs: string[]; packageNames: string[] }) => void;
  setupDirectPattern: (params: { packageName: string }) => void;
  setupGlobPatternDirFails: () => void;
} => {
  const readdirProxy = readdirEntriesProxy();
  const readProxy = packageReadLayerBrokerProxy();

  return {
    setupGlobPattern: ({
      dirs,
      packageNames,
    }: {
      dirs: string[];
      packageNames: string[];
    }): void => {
      readdirProxy.returns({
        path: String(PACKAGES_DIR),
        entries: dirs.map((name) => ({ name, kind: 'directory' as const })),
      });
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
      readdirProxy.missing({ path: String(PACKAGES_DIR) });
    },
  };
};
