import { readFileBytesProxy } from '#gateway/node/_test_';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

export const fsReadFileBytesAdapterProxy = (): {
  returns: (params: { filePath: AbsoluteFilePath; bytes: Uint8Array }) => void;
  throws: (params: { filePath: AbsoluteFilePath; error: Error }) => void;
} => {
  const childProxy = readFileBytesProxy();

  return {
    returns: ({ filePath, bytes }: { filePath: AbsoluteFilePath; bytes: Uint8Array }): void => {
      childProxy.returns({ path: filePath, bytes });
    },
    throws: ({ filePath, error }: { filePath: AbsoluteFilePath; error: Error }): void => {
      childProxy.rejects({ path: filePath, error });
    },
  };
};
