import { glob } from 'glob';
import type { GlobPattern } from '../../../contracts/glob-pattern/glob-pattern-contract';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

jest.mock('glob');

export const globFindAdapterProxy = (): {
  returns: (params: { pattern: GlobPattern; files: readonly FilePath[] }) => void;
  returnsNonArray: (params: { pattern: GlobPattern; files: readonly FilePath[] }) => void;
  throws: (params: { pattern: GlobPattern; error: Error }) => void;
  throwsNonArray: (params: { pattern: GlobPattern; error: Error }) => void;
} => {
  const mockGlob = jest.mocked(glob);

  mockGlob.mockImplementation(async () => Promise.resolve([]));

  return {
    returns: ({ files }: { pattern: GlobPattern; files: readonly FilePath[] }): void => {
      mockGlob.mockResolvedValueOnce([...files]);
    },
    returnsNonArray: ({ files }: { pattern: GlobPattern; files: readonly FilePath[] }): void => {
      // Simulates glob v7 behavior: returns a non-iterable Glob instance on first call,
      // then provides results via callback on the second (fallback) call
      const globInstance = { constructor: { name: 'Glob' } };
      mockGlob.mockResolvedValueOnce(globInstance as unknown as FilePath[]);
      const v7Handler = (...args: unknown[]): void => {
        const callback = args[2] as (error: null, matches: readonly FilePath[]) => void;
        callback(null, [...files]);
      };
      mockGlob.mockImplementationOnce(v7Handler as unknown as typeof glob);
    },
    throws: ({ error }: { pattern: GlobPattern; error: Error }): void => {
      mockGlob.mockRejectedValueOnce(error);
    },
    throwsNonArray: ({ error }: { pattern: GlobPattern; error: Error }): void => {
      const globInstance = { constructor: { name: 'Glob' } };
      mockGlob.mockResolvedValueOnce(globInstance as unknown as FilePath[]);
      const v7Handler = (...args: unknown[]): void => {
        const callback = args[2] as (error: Error, matches: null) => void;
        callback(error, null);
      };
      mockGlob.mockImplementationOnce(v7Handler as unknown as typeof glob);
    },
  };
};
