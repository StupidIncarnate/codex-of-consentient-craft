import { glob } from 'glob';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { GlobPattern } from '../../../contracts/glob-pattern/glob-pattern-contract';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';

export const globFindAdapterProxy = (): {
  returns: (params: { pattern: GlobPattern; filePaths: readonly AbsoluteFilePath[] }) => void;
  throws: (params: { pattern: GlobPattern; error: Error }) => void;
} => {
  const mock = registerMock({ fn: glob });

  mock.mockImplementation(async () => Promise.resolve([]));

  return {
    returns: ({
      filePaths,
    }: {
      pattern: GlobPattern;
      filePaths: readonly AbsoluteFilePath[];
    }): void => {
      mock.mockResolvedValueOnce([...filePaths]);
    },

    throws: ({ error }: { pattern: GlobPattern; error: Error }): void => {
      mock.mockRejectedValueOnce(error);
    },
  };
};
