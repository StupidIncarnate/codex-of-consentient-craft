import { writeFile } from 'fs/promises';
import type { FileContents, FilePath } from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const fsWriteFileAdapterProxy = (): {
  succeeds: ({ filepath, contents }: { filepath: FilePath; contents: FileContents }) => void;
  throws: ({ filepath, error }: { filepath: FilePath; error: Error }) => void;
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
  };
};
