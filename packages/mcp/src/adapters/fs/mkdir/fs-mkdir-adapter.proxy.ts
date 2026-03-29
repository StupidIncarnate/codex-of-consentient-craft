import { mkdir } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const fsMkdirAdapterProxy = (): {
  succeeds: ({ filepath }: { filepath: FilePath }) => void;
  throws: ({ filepath, error }: { filepath: FilePath; error: Error }) => void;
} => {
  const handle = registerMock({ fn: mkdir });

  handle.mockResolvedValue(undefined);

  return {
    succeeds: ({ filepath: _filepath }: { filepath: FilePath }): void => {
      handle.mockResolvedValueOnce(undefined);
    },
    throws: ({ filepath: _filepath, error }: { filepath: FilePath; error: Error }): void => {
      handle.mockRejectedValueOnce(error);
    },
  };
};
