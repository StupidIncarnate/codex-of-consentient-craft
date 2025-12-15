import { readdir } from 'fs/promises';
import type { FolderName } from '../../../contracts/folder-name/folder-name-contract';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

jest.mock('fs/promises');

export const fsReaddirAdapterProxy = (): {
  returns: ({ filepath, entries }: { filepath: FilePath; entries: FolderName[] }) => void;
  throws: ({ filepath, error }: { filepath: FilePath; error: Error }) => void;
} => {
  const mockReaddir = jest.mocked(readdir);

  mockReaddir.mockResolvedValue([]);

  return {
    returns: ({
      filepath: _filepath,
      entries,
    }: {
      filepath: FilePath;
      entries: FolderName[];
    }): void => {
      mockReaddir.mockResolvedValueOnce(entries as unknown as ReturnType<typeof readdir>);
    },
    throws: ({ filepath: _filepath, error }: { filepath: FilePath; error: Error }): void => {
      mockReaddir.mockRejectedValueOnce(error);
    },
  };
};
