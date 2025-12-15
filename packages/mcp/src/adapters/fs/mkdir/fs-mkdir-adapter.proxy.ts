import { mkdir } from 'fs/promises';
import type * as FsPromises from 'fs/promises';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

jest.mock('fs/promises');

export const fsMkdirAdapterProxy = (): {
  succeeds: ({ filepath }: { filepath: FilePath }) => void;
  throws: ({ filepath, error }: { filepath: FilePath; error: Error }) => void;
} => {
  const mockMkdir = jest.mocked(mkdir);

  mockMkdir.mockImplementation(async (path, options) => {
    const actualFs = jest.requireActual<typeof FsPromises>('fs/promises');
    return actualFs.mkdir(path, options);
  });

  return {
    succeeds: ({ filepath: _filepath }: { filepath: FilePath }): void => {
      mockMkdir.mockResolvedValueOnce(undefined);
    },
    throws: ({ filepath: _filepath, error }: { filepath: FilePath; error: Error }): void => {
      mockMkdir.mockRejectedValueOnce(error);
    },
  };
};
