import { openSync } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import type { FileDescriptor } from '../../../contracts/file-descriptor/file-descriptor-contract';

export const fsOpenFdAdapterProxy = (): {
  returns: (params: { filePath: AbsoluteFilePath; fd: FileDescriptor }) => void;
  throws: (params: { filePath: AbsoluteFilePath; error: Error }) => void;
  getFlagFor: (params: { filePath: AbsoluteFilePath }) => unknown;
} => {
  const handle = registerMock({ fn: openSync });

  return {
    returns: ({ filePath, fd }: { filePath: AbsoluteFilePath; fd: FileDescriptor }): void => {
      handle.calledWith([filePath]).returns(fd);
    },

    throws: ({ filePath, error }: { filePath: AbsoluteFilePath; error: Error }): void => {
      handle.calledWith([filePath]).throws(error);
    },

    // Confirms the append flag ('a') was passed for this path.
    getFlagFor: ({ filePath }: { filePath: AbsoluteFilePath }): unknown =>
      handle.callsMatching([filePath]).at(-1)?.[1],
  };
};
