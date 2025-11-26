/**
 * PURPOSE: Proxy for fs-exists-sync-adapter that mocks fs.existsSync
 *
 * USAGE:
 * const proxy = fsExistsSyncAdapterProxy();
 * proxy.returnsTrue({filePath});
 * // Sets up mock to return true for the given file path
 */

import { existsSync } from 'fs';
import type { FilePathStub } from '../../../contracts/file-path/file-path.stub';

jest.mock('fs');

type FilePath = ReturnType<typeof FilePathStub>;

export const fsExistsSyncAdapterProxy = (): {
  returnsTrue: ({ filePath }: { filePath: FilePath }) => void;
  returnsFalse: ({ filePath }: { filePath: FilePath }) => void;
} => {
  const mock = jest.mocked(existsSync);

  mock.mockReturnValue(false);

  return {
    returnsTrue: ({ filePath }: { filePath: FilePath }): void => {
      mock.mockImplementation((path) => path === filePath);
    },

    returnsFalse: ({ filePath }: { filePath: FilePath }): void => {
      mock.mockImplementation((path) => path !== filePath);
    },
  };
};
