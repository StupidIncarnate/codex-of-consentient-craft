import { writeFile } from 'fs/promises';
import type * as FsPromises from 'fs/promises';
import type { FileContents, FilePath } from '@dungeonmaster/shared/contracts';

jest.mock('fs/promises');

export const fsWriteFileAdapterProxy = (): {
  succeeds: ({ filepath, contents }: { filepath: FilePath; contents: FileContents }) => void;
  throws: ({ filepath, error }: { filepath: FilePath; error: Error }) => void;
} => {
  const mockWriteFile = jest.mocked(writeFile);

  mockWriteFile.mockImplementation(async (path, data) => {
    const actualFs = jest.requireActual<typeof FsPromises>('fs/promises');
    return actualFs.writeFile(path, data, 'utf-8');
  });

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
  };
};
