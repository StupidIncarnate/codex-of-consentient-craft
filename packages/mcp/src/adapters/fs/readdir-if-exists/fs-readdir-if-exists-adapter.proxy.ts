import { readdir } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FolderName } from '../../../contracts/folder-name/folder-name-contract';

export const fsReaddirIfExistsAdapterProxy = (): {
  returns: (params: { entries: FolderName[] }) => void;
  returnsUndefined: () => void;
} => {
  const handle = registerMock({ fn: readdir });

  handle.mockResolvedValue([]);

  return {
    returns: ({ entries }: { entries: FolderName[] }): void => {
      handle.mockResolvedValueOnce(entries);
    },
    returnsUndefined: (): void => {
      handle.mockRejectedValueOnce(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
    },
  };
};
