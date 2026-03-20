import { glob } from 'glob';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { GlobPattern } from '../../../contracts/glob-pattern/glob-pattern-contract';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const fsGlobAdapterProxy = (): {
  returns: ({ pattern, files }: { pattern: GlobPattern; files: FilePath[] }) => void;
} => {
  const handle = registerMock({ fn: glob });

  handle.mockImplementation(async () => Promise.resolve([]));

  return {
    returns: ({ files }: { pattern: GlobPattern; files: FilePath[] }): void => {
      handle.mockResolvedValueOnce(files);
    },
  };
};
