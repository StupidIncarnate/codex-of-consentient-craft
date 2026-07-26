import { writeFile } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FileContents } from '../../../contracts/file-contents/file-contents-contract';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const fsWriteFileAdapterProxy = (): {
  succeeds: ({ filepath, contents }: { filepath: FilePath; contents: FileContents }) => void;
  throws: ({ filepath, error }: { filepath: FilePath; error: Error }) => void;
  getWrittenFor: ({ filepath }: { filepath: FilePath }) => unknown;
} => {
  const mockWriteFile = registerMock({ fn: writeFile });

  return {
    succeeds: ({
      filepath,
      contents: _contents,
    }: {
      filepath: FilePath;
      contents: FileContents;
    }): void => {
      mockWriteFile.calledWith([filepath]).resolves({ success: true as const });
    },
    throws: ({ filepath, error }: { filepath: FilePath; error: Error }): void => {
      mockWriteFile.calledWith([filepath]).rejects(error);
    },

    // Answers for THIS path only — a call to a different path never satisfies this lookup.
    getWrittenFor: ({ filepath }: { filepath: FilePath }): unknown =>
      mockWriteFile.callsMatching([filepath]).at(-1)?.[1],
  };
};
