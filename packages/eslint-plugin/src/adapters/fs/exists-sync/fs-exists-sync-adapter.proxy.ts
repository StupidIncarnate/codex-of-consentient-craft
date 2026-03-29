import { existsSync } from 'fs';
import type { PathLike } from 'fs';
import type { FilePath } from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const fsExistsSyncAdapterProxy = (): {
  returns: (args: { filePath: FilePath; exists: boolean }) => void;
  setupFileSystem: (fn: (path: PathLike) => boolean) => void;
} => {
  const mock = registerMock({ fn: existsSync });

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
