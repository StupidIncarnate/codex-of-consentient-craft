import { writeFile } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FileContents } from '../../../contracts/file-contents/file-contents-contract';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const fsWriteFileAdapterProxy = (): {
  succeeds: ({ filepath, contents }: { filepath: FilePath; contents: FileContents }) => void;
  throws: ({ filepath, error }: { filepath: FilePath; error: Error }) => void;
  getWrittenContent: () => unknown;
} => {
  const mockWriteFile = registerMock({ fn: writeFile });

  mockWriteFile.mockResolvedValue(undefined);

  return {
    succeeds: ({
      filepath: _filepath,
      contents: _contents,
    }: {
      filepath: FilePath;
      contents: FileContents;
    }): void => {
      mockWriteFile.mockResolvedValueOnce(undefined);
    },
    throws: ({ filepath: _filepath, error }: { filepath: FilePath; error: Error }): void => {
      mockWriteFile.mockRejectedValueOnce(error);
    },

    getWrittenContent: (): unknown => {
      const { calls } = mockWriteFile.mock;
      const lastCall = calls[calls.length - 1];
      if (!lastCall) return undefined;
      return lastCall[1];
    },
  };
};
