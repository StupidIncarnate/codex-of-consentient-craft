import { existsSync } from 'fs';
import type { PathLike } from 'fs';
import type { FilePath } from '@dungeonmaster/shared/contracts';

// ✅ Mock declared in proxy - automatically hoisted when proxy is imported
jest.mock('fs');

export const fsExistsSyncAdapterProxy = (): {
  returns: (args: { filePath: FilePath; exists: boolean }) => void;
  setupFileSystem: (fn: (path: PathLike) => boolean) => void;
} => {
  // ✅ Mock the npm dependency (fs.existsSync), not the adapter!
  const mock = jest.mocked(existsSync);

  // Set up default mock behavior
  mock.mockReturnValue(false);

  return {
    returns: ({ exists }: { filePath: FilePath; exists: boolean }): void => {
      mock.mockReturnValue(exists);
    },
    setupFileSystem: (fn: (path: PathLike) => boolean): void => {
      mock.mockImplementation(fn);
    },
  };
};
