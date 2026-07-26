import { glob } from 'glob';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { GlobPattern } from '@dungeonmaster/shared/contracts';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const globFindAdapterProxy = (): {
  returns: (params: { pattern: GlobPattern; files: readonly FilePath[] }) => void;
  returnsNonArray: (params: { pattern: GlobPattern; files: readonly FilePath[] }) => void;
  throws: (params: { pattern: GlobPattern; error: Error }) => void;
  throwsNonArray: (params: { pattern: GlobPattern; error: Error }) => void;
} => {
  const mockGlob = registerMock({ fn: glob });

  return {
    returns: ({ pattern, files }: { pattern: GlobPattern; files: readonly FilePath[] }): void => {
      mockGlob.calledWith([pattern]).resolves([...files]);
    },
    returnsNonArray: ({
      pattern,
      files,
    }: {
      pattern: GlobPattern;
      files: readonly FilePath[];
    }): void => {
      // Simulates glob v7 behavior: returns a non-iterable Glob instance on first call, then
      // provides results via callback on the second (fallback) call. Both calls share the same
      // pattern, so each response is staged once-for that key and consumed in registration order.
      const globInstance = { constructor: { name: 'Glob' } };
      mockGlob.onceFor([pattern]).resolves(globInstance);
      const v7Handler = (...args: unknown[]): void => {
        const callback = args[2] as (error: null, matches: readonly FilePath[]) => void;
        callback(null, [...files]);
      };
      mockGlob.onceFor([pattern]).implement(v7Handler);
    },
    throws: ({ pattern, error }: { pattern: GlobPattern; error: Error }): void => {
      mockGlob.calledWith([pattern]).rejects(error);
    },
    throwsNonArray: ({ pattern, error }: { pattern: GlobPattern; error: Error }): void => {
      const globInstance = { constructor: { name: 'Glob' } };
      mockGlob.onceFor([pattern]).resolves(globInstance);
      const v7Handler = (...args: unknown[]): void => {
        const callback = args[2] as (error: Error, matches: null) => void;
        callback(error, null);
      };
      mockGlob.onceFor([pattern]).implement(v7Handler);
    },
  };
};
