import { readFileIfExistsProxy } from '#gateway/node/fs__promises/read-file-if-exists/read-file-if-exists.proxy';

export const censusRepoReadSourcesChunkLayerBrokerProxy = (): {
  setupFile: (params: { path: string; contents: string }) => void;
  setupMissingFile: (params: { path: string }) => void;
} => {
  const readHandle = readFileIfExistsProxy();

  return {
    setupFile: ({ path, contents }): void => {
      readHandle.returns({ path, contents });
    },
    setupMissingFile: ({ path }): void => {
      readHandle.missing({ path });
    },
  };
};
