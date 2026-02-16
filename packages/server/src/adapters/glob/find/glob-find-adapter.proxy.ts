import { glob } from 'glob';
import type { GlobPattern } from '../../../contracts/glob-pattern/glob-pattern-contract';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

jest.mock('glob');

export const globFindAdapterProxy = (): {
  returns: (params: { pattern: GlobPattern; files: readonly FilePath[] }) => void;
  throws: (params: { pattern: GlobPattern; error: Error }) => void;
} => {
  const mockGlob = jest.mocked(glob);

  mockGlob.mockImplementation(async () => Promise.resolve([]));

  return {
    returns: ({ files }: { pattern: GlobPattern; files: readonly FilePath[] }): void => {
      mockGlob.mockResolvedValueOnce([...files]);
    },
    throws: ({ error }: { pattern: GlobPattern; error: Error }): void => {
      mockGlob.mockRejectedValueOnce(error);
    },
  };
};
