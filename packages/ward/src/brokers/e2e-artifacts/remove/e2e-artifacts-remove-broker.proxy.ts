import { filePathContract, type AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { fsRmAdapterProxy } from '../../../adapters/fs/rm/fs-rm-adapter.proxy';

export const e2eArtifactsRemoveBrokerProxy = (): {
  setupRemovable: (params: { packageRoot: AbsoluteFilePath; port: number }) => void;
  setupRemoveFails: (params: { packageRoot: AbsoluteFilePath; port: number }) => void;
  getRemovedPaths: (params: {
    packageRoot: AbsoluteFilePath;
    port: number;
  }) => readonly unknown[][];
} => {
  const rmProxy = fsRmAdapterProxy();

  const cachePathFor = ({
    packageRoot,
    port,
  }: {
    packageRoot: AbsoluteFilePath;
    port: number;
  }): ReturnType<typeof filePathContract.parse> =>
    filePathContract.parse(`${String(packageRoot)}/node_modules/.vite-${String(port)}`);

  return {
    setupRemovable: ({ packageRoot, port }): void => {
      rmProxy.succeeds({ filePath: cachePathFor({ packageRoot, port }) });
    },
    setupRemoveFails: ({ packageRoot, port }): void => {
      rmProxy.throws({
        filePath: cachePathFor({ packageRoot, port }),
        error: new Error('EACCES: permission denied'),
      });
    },
    getRemovedPaths: ({ packageRoot, port }): readonly unknown[][] =>
      rmProxy.getCallsFor({ filePath: cachePathFor({ packageRoot, port }) }),
  };
};
