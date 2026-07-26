import { existsSync } from 'fs';
import type { PathLike } from 'fs';
import type { FilePath } from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const fsExistsSyncAdapterProxy = (): {
  returns: (args: { filePath: FilePath; exists: boolean }) => void;
  setupFileSystem: (fn: (path: PathLike) => boolean) => void;
} => {
  const mock = registerMock({ fn: existsSync });

  return {
    returns: ({ filePath, exists }: { filePath: FilePath; exists: boolean }): void => {
      mock.calledWith([filePath]).returns(exists);
    },
    setupFileSystem: (fn: (path: PathLike) => boolean): void => {
      mock.mockImplementation(fn);
    },
  };
};
