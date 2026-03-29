import { glob } from 'glob';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { GlobPattern } from '../../../contracts/glob-pattern/glob-pattern-contract';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const globFindAdapterProxy = (): {
  returns: (params: { pattern: GlobPattern; files: readonly FilePath[] }) => void;
  throws: (params: { pattern: GlobPattern; error: Error }) => void;
} => {
  const handle = registerMock({ fn: glob });

  handle.mockResolvedValue([]);

  return {
    returns: ({ files }: { pattern: GlobPattern; files: readonly FilePath[] }): void => {
      handle.mockResolvedValueOnce([...files]);
    },
    throws: ({ error }: { pattern: GlobPattern; error: Error }): void => {
      handle.mockRejectedValueOnce(error);
    },
  };
};
