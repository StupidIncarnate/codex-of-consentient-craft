import type { Dirent } from '#gateway/node/fs';
import { listDirEntriesLayerBrokerProxy } from './list-dir-entries-layer-broker.proxy';

export const startupFilesFindLayerBrokerProxy = (): {
  setupFiles: ({ packageSrcPath, names }: { packageSrcPath: string; names: string[] }) => void;
  setupEmpty: ({ packageSrcPath }: { packageSrcPath: string }) => void;
  setupImplementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }) => void;
} => {
  const listProxy = listDirEntriesLayerBrokerProxy();

  return {
    setupFiles: ({ packageSrcPath, names }: { packageSrcPath: string; names: string[] }): void => {
      const dirPath = `${packageSrcPath}/startup`;
      listProxy.setupFiles({ dirPath, names });
    },

    setupEmpty: ({ packageSrcPath }: { packageSrcPath: string }): void => {
      const dirPath = `${packageSrcPath}/startup`;
      listProxy.setupEmpty({ dirPath });
    },

    setupImplementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }): void => {
      listProxy.setupImplementation({ fn });
    },
  };
};
