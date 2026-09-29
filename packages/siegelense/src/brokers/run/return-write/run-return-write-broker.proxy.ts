import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { FsErrorStub } from '#gateway/node/fs/is-fs-error/fs-error.stub';
import { writeFileProxy } from '#gateway/node/fs__promises/write-file/write-file.proxy';

export const runReturnWriteBrokerProxy = (): {
  succeeds: (params: { storedReturnPath: AbsoluteFilePath }) => void;
  throws: (params: { storedReturnPath: AbsoluteFilePath; code: string }) => void;
  writtenFor: (params: { storedReturnPath: AbsoluteFilePath }) => unknown;
} => {
  const writeProxy = writeFileProxy();

  return {
    succeeds: ({ storedReturnPath }: { storedReturnPath: AbsoluteFilePath }): void => {
      writeProxy.succeeds({ path: storedReturnPath });
    },

    throws: ({
      storedReturnPath,
      code,
    }: {
      storedReturnPath: AbsoluteFilePath;
      code: string;
    }): void => {
      writeProxy.rejects({
        path: storedReturnPath,
        error: FsErrorStub({ code, path: storedReturnPath, syscall: 'write' }),
      });
    },

    writtenFor: ({ storedReturnPath }: { storedReturnPath: AbsoluteFilePath }): unknown =>
      writeProxy.writtenContentsFor({ path: storedReturnPath }),
  };
};
