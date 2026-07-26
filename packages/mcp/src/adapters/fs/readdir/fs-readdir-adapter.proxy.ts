import { readdir } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FolderName } from '../../../contracts/folder-name/folder-name-contract';
import type { PathSegment } from '@dungeonmaster/shared/contracts';

export const fsReaddirAdapterProxy = (): {
  returns: ({ filepath, entries }: { filepath: PathSegment; entries: FolderName[] }) => void;
  throws: ({ filepath, error }: { filepath: PathSegment; error: Error }) => void;
} => {
  const handle = registerMock({ fn: readdir });

  return {
    // readdir's PATH (its only argument) is the address.
    returns: ({ filepath, entries }: { filepath: PathSegment; entries: FolderName[] }): void => {
      handle.calledWith([filepath]).resolves(entries);
    },
    throws: ({ filepath, error }: { filepath: PathSegment; error: Error }): void => {
      handle.calledWith([filepath]).rejects(error);
    },
  };
};
