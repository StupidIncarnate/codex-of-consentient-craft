import { writeFile } from 'fs/promises';
import type { FileContents, FilePath } from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const fsWriteFileAdapterProxy = (): {
  succeeds: ({ filepath, contents }: { filepath: FilePath; contents: FileContents }) => void;
  throws: ({ filepath, error }: { filepath: FilePath; error: Error }) => void;
} => {
  const mockWriteFile = registerMock({ fn: writeFile });

  mockWriteFile.mockResolvedValue({ success: true as const });

  return {
    succeeds: ({
      filepath: _filepath,
      contents: _contents,
    }: {
      filepath: FilePath;
      contents: FileContents;
    }): void => {
      mockWriteFile.mockResolvedValueOnce({ success: true as const });
    },
    throws: ({ filepath: _filepath, error }: { filepath: FilePath; error: Error }): void => {
      mockWriteFile.mockRejectedValueOnce(error);
    },
  };
};
