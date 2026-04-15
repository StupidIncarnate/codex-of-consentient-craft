import { readdir } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FolderName } from '../../../contracts/folder-name/folder-name-contract';
import type { PathSegment } from '@dungeonmaster/shared/contracts';

export const fsReaddirAdapterProxy = (): {
  returns: ({ filepath, entries }: { filepath: PathSegment; entries: FolderName[] }) => void;
  throws: ({ filepath, error }: { filepath: PathSegment; error: Error }) => void;
} => {
  const handle = registerMock({ fn: readdir });

  handle.mockResolvedValue([]);

  return {
    returns: ({
      filepath: _filepath,
      entries,
    }: {
      filepath: PathSegment;
      entries: FolderName[];
    }): void => {
      handle.mockResolvedValueOnce(entries);
    },
    throws: ({ filepath: _filepath, error }: { filepath: PathSegment; error: Error }): void => {
      handle.mockRejectedValueOnce(error);
    },
  };
};
