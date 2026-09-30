import { readFileIfExistsProxy } from '#gateway/node/fs__promises/read-file-if-exists/read-file-if-exists.proxy';

export const bufferReadLayerBrokerProxy = (): {
  setupBuffer: (params: { bufferPath: string; content: string }) => void;
  setupMissingBuffer: (params: { bufferPath: string }) => void;
} => {
  const readFileProxy = readFileIfExistsProxy();

  return {
    setupBuffer: ({ bufferPath, content }: { bufferPath: string; content: string }): void => {
      readFileProxy.returns({ path: bufferPath, contents: content });
    },

    setupMissingBuffer: ({ bufferPath }: { bufferPath: string }): void => {
      readFileProxy.missing({ path: bufferPath });
    },
  };
};
