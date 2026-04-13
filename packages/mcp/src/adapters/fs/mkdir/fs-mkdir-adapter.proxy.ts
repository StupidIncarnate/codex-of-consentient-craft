import { mkdir } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const fsMkdirAdapterProxy = (): {
  succeeds: ({ filepath }: { filepath: FilePath }) => void;
  throws: ({ filepath, error }: { filepath: FilePath; error: Error }) => void;
} => {
  const handle = registerMock({ fn: mkdir });

  handle.mockResolvedValue({ success: true as const });

  return {
    succeeds: ({ filepath: _filepath }: { filepath: FilePath }): void => {
      handle.mockResolvedValueOnce({ success: true as const });
    },
    throws: ({ filepath: _filepath, error }: { filepath: FilePath; error: Error }): void => {
      handle.mockRejectedValueOnce(error);
    },
  };
};
