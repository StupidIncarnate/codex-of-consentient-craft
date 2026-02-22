import { glob } from 'glob';
import type { GlobPattern } from '../../../contracts/glob-pattern/glob-pattern-contract';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

jest.mock('glob');

export const fsGlobAdapterProxy = (): {
  returns: ({ pattern, files }: { pattern: GlobPattern; files: FilePath[] }) => void;
} => {
  const mockGlob = jest.mocked(glob);

  mockGlob.mockImplementation(async () => Promise.resolve([]));

  return {
    returns: ({ files }: { pattern: GlobPattern; files: FilePath[] }): void => {
      mockGlob.mockResolvedValueOnce(files);
    },
  };
};
