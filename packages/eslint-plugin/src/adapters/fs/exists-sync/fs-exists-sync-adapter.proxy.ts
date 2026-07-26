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
      // No single path to key on: callers pass a general predicate that decides across many
      // candidate paths (rule colocation checks walk arbitrary filenames), so [] is the honest
      // address rather than inventing a per-path key the caller never gave us.
      mock.calledWith([]).implement(fn);
    },
  };
};
