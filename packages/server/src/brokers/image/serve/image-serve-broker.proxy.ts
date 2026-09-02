import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { fsReadFileBytesAdapterProxy } from '../../../adapters/fs/read-file-bytes/fs-read-file-bytes-adapter.proxy';
import { processDevLogAdapterProxy } from '../../../adapters/process/dev-log/process-dev-log-adapter.proxy';

export const imageServeBrokerProxy = (): {
  setupFileBytes: (params: { filePath: AbsoluteFilePath; bytes: Uint8Array }) => void;
  setupReadFailure: (params: { filePath: AbsoluteFilePath; error: Error }) => void;
} => {
  const readProxy = fsReadFileBytesAdapterProxy();
  processDevLogAdapterProxy();

  return {
    setupFileBytes: ({ filePath, bytes }): void => {
      readProxy.returns({ filePath, bytes });
    },
    setupReadFailure: ({ filePath, error }): void => {
      readProxy.throws({ filePath, error });
    },
  };
};
