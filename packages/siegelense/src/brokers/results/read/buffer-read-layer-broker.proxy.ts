import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import { readFileIfExistsProxy } from '#gateway/node/fs__promises/read-file-if-exists/read-file-if-exists.proxy';

export const bufferReadLayerBrokerProxy = (): {
  setupBuffer: (params: { bufferPath: AbsoluteFilePath; content: string }) => void;
  setupMissingBuffer: (params: { bufferPath: AbsoluteFilePath }) => void;
} => {
  const readFileProxy = readFileIfExistsProxy();

  return {
    setupBuffer: ({
      bufferPath,
      content,
    }: {
      bufferPath: AbsoluteFilePath;
      content: string;
    }): void => {
      readFileProxy.returns({ path: bufferPath, contents: content });
    },

    setupMissingBuffer: ({ bufferPath }: { bufferPath: AbsoluteFilePath }): void => {
      readFileProxy.missing({ path: bufferPath });
    },
  };
};
