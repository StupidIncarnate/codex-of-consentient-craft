import { readdir } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FolderName } from '../../../contracts/folder-name/folder-name-contract';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const fsReaddirAdapterProxy = (): {
  returns: ({ filepath, entries }: { filepath: FilePath; entries: FolderName[] }) => void;
  throws: ({ filepath, error }: { filepath: FilePath; error: Error }) => void;
} => {
  const handle = registerMock({ fn: readdir });

  handle.mockResolvedValue([]);

  return {
    returns: ({
      filepath: _filepath,
      entries,
    }: {
      filepath: FilePath;
      entries: FolderName[];
    }): void => {
      handle.mockResolvedValueOnce(entries);
    },
    throws: ({ filepath: _filepath, error }: { filepath: FilePath; error: Error }): void => {
      handle.mockRejectedValueOnce(error);
    },
  };
};
