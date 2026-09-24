import { writeFile } from 'fs/promises';
import type { FileContents, FilePath } from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';

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
    // Answers for this path only — never "whatever was written last".
    getWrittenFor: ({ filepath }: { filepath: FilePath }): unknown =>
      mockWriteFile.callsMatching([filepath]).at(-1)?.[1],
  };
};
