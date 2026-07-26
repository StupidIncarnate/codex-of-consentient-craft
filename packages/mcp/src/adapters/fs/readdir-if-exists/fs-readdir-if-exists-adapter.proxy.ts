import { readdir } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FolderName } from '../../../contracts/folder-name/folder-name-contract';
import type { PathSegment } from '@dungeonmaster/shared/contracts';

export const fsReaddirIfExistsAdapterProxy = (): {
  returns: (params: { filepath: PathSegment; entries: FolderName[] }) => void;
  returnsUndefined: (params: { filepath: PathSegment }) => void;
} => {
  const handle = registerMock({ fn: readdir });

  return {
    // readdir's PATH (its only argument) is the address.
    returns: ({ filepath, entries }: { filepath: PathSegment; entries: FolderName[] }): void => {
      handle.calledWith([filepath]).resolves(entries);
    },
    returnsUndefined: ({ filepath }: { filepath: PathSegment }): void => {
      handle.calledWith([filepath]).rejects(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
    },
  };
};
