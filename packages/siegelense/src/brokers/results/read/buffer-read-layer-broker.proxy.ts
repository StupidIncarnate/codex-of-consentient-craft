import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { errorIsNativeErrorAdapterProxy } from '../../../adapters/error/is-native-error/error-is-native-error-adapter.proxy';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';

export const bufferReadLayerBrokerProxy = (): {
  setupBuffer: (params: { bufferPath: AbsoluteFilePath; content: string }) => void;
  setupMissingBuffer: (params: { bufferPath: AbsoluteFilePath }) => void;
} => {
  errorIsNativeErrorAdapterProxy();
  const readFileProxy = fsReadFileAdapterProxy();

  return {
    setupBuffer: ({
      bufferPath,
      content,
    }: {
      bufferPath: AbsoluteFilePath;
      content: string;
    }): void => {
      readFileProxy.resolves({ filePath: bufferPath, content });
    },

    setupMissingBuffer: ({ bufferPath }: { bufferPath: AbsoluteFilePath }): void => {
      readFileProxy.rejects({
        filePath: bufferPath,
        error: Object.assign(new Error('ENOENT: no such file or directory'), { code: 'ENOENT' }),
      });
    },
  };
};
