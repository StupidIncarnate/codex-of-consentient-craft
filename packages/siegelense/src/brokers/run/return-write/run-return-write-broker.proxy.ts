import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';

export const runReturnWriteBrokerProxy = (): {
  succeeds: (params: { storedReturnPath: AbsoluteFilePath }) => void;
  throws: (params: { storedReturnPath: AbsoluteFilePath; error: Error }) => void;
  writtenFor: (params: { storedReturnPath: AbsoluteFilePath }) => unknown;
} => {
  const writeProxy = fsWriteFileAdapterProxy();

  return {
    succeeds: ({ storedReturnPath }: { storedReturnPath: AbsoluteFilePath }): void => {
      writeProxy.succeeds({ filePath: storedReturnPath });
    },

    throws: ({
      storedReturnPath,
      error,
    }: {
      storedReturnPath: AbsoluteFilePath;
      error: Error;
    }): void => {
      writeProxy.throws({ filePath: storedReturnPath, error });
    },

    writtenFor: ({ storedReturnPath }: { storedReturnPath: AbsoluteFilePath }): unknown =>
      writeProxy.getWrittenFor({ filePath: storedReturnPath }),
  };
};
