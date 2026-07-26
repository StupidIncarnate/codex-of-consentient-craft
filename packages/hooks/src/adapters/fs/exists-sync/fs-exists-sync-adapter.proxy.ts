import { existsSync } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const fsExistsSyncAdapterProxy = (): {
  returns: ({ filePath, exists }: { filePath: FilePath; exists: boolean }) => void;
} => {
  const mock = registerMock({ fn: existsSync });

  // Config-file walk-up loops (eslintLoadConfigBroker, hookConfigLoadBroker) probe many
  // candidate paths a given test never names. Default every unaddressed path to "does not
  // exist" — a later, path-specific `.returns()` staging always wins over this catch-all.
  mock.calledWith([]).returns(false);

  return {
    returns: ({ filePath, exists }: { filePath: FilePath; exists: boolean }): void => {
      mock.calledWith([filePath]).returns(exists);
    },
  };
};
