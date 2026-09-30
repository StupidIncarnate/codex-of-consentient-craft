
import { FsErrorStub } from '#gateway/node/fs/is-fs-error/fs-error.stub';
import { writeFileProxy } from '#gateway/node/fs__promises/write-file/write-file.proxy';

export const runReturnWriteBrokerProxy = (): {
  succeeds: (params: { storedReturnPath: string }) => void;
  throws: (params: { storedReturnPath: string; code: string }) => void;
  writtenFor: (params: { storedReturnPath: string }) => unknown;
} => {
  const writeProxy = writeFileProxy();

  return {
    succeeds: ({ storedReturnPath }: { storedReturnPath: string }): void => {
      writeProxy.succeeds({ path: storedReturnPath });
    },

    throws: ({
      storedReturnPath,
      code,
    }: {
      storedReturnPath: string;
      code: string;
    }): void => {
      writeProxy.rejects({
        path: storedReturnPath,
        error: FsErrorStub({ code, path: storedReturnPath, syscall: 'write' }),
      });
    },

    writtenFor: ({ storedReturnPath }: { storedReturnPath: string }): unknown =>
      writeProxy.writtenContentsFor({ path: storedReturnPath }),
  };
};
