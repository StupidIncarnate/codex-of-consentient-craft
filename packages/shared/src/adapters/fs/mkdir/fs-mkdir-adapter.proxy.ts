/**
 * PURPOSE: Proxy for fsMkdirAdapter that mocks fs/promises mkdir
 *
 * USAGE:
 * const proxy = fsMkdirAdapterProxy();
 * proxy.succeeds({ filepath });
 */

import { mkdir } from 'fs/promises';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

jest.mock('fs/promises');

export const fsMkdirAdapterProxy = (): {
  succeeds: ({ filepath }: { filepath: FilePath }) => void;
  throws: ({ filepath, error }: { filepath: FilePath; error: Error }) => void;
  getCreatedDirs: () => readonly unknown[];
} => {
  const mockMkdir = jest.mocked(mkdir);

  mockMkdir.mockResolvedValue(undefined);

  return {
    succeeds: ({ filepath: _filepath }: { filepath: FilePath }): void => {
      mockMkdir.mockResolvedValueOnce(undefined);
    },
    throws: ({ filepath: _filepath, error }: { filepath: FilePath; error: Error }): void => {
      mockMkdir.mockRejectedValueOnce(error);
    },
    getCreatedDirs: (): readonly unknown[] => mockMkdir.mock.calls.map((call) => call[0]),
  };
};
