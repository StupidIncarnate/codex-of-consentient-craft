import { readdir } from 'fs/promises';
import type { FileName } from '../../../contracts/file-name/file-name-contract';

jest.mock('fs/promises');

export const fsReadDirAdapterProxy = (): {
  returns: (params: { files: FileName[] }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock = jest.mocked(readdir);

  mock.mockResolvedValue([]);

  return {
    returns: ({ files }: { files: FileName[] }): void => {
      mock.mockResolvedValueOnce(files as never);
    },
    throws: ({ error }: { error: Error }): void => {
      mock.mockRejectedValueOnce(error);
    },
  };
};
