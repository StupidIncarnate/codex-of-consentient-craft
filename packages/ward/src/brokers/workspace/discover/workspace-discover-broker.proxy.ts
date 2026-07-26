import { AbsoluteFilePathStub, filePathContract } from '@dungeonmaster/shared/contracts';

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

  // Every caller (workspace-discover-broker.test.ts, command-run-broker.proxy.ts,
  // ward-refs-responder.proxy.ts) resolves the root package.json for rootPath '/project'.
  const filePath = filePathContract.parse(
    `${AbsoluteFilePathStub({ value: '/project' })}/package.json`,
  );

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
        filePath,
        content: JSON.stringify({ name: 'root', workspaces: patterns }),
      });
      patternProxy.setupGlobPattern({ dirs, packageNames });
    },

    setupSinglePackage: (): void => {
      readProxy.returns({
        filePath,
        content: JSON.stringify({ name: 'my-package' }),
      });
    },

    setupNoPackageJson: (): void => {
      readProxy.throws({ filePath, error: new Error('ENOENT') });
    },
  };
};
