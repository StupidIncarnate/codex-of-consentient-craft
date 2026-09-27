import { glob } from 'glob';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { GlobPattern } from '@dungeonmaster/shared/contracts';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const globFindAdapterProxy = (): {
  returns: (params: { pattern: GlobPattern; cwd: FilePath; files: readonly FilePath[] }) => void;
  returnsNonArray: (params: {
    pattern: GlobPattern;
    cwd: FilePath;
    files: readonly FilePath[];
  }) => void;
  throws: (params: { pattern: GlobPattern; cwd: FilePath; error: Error }) => void;
  throwsNonArray: (params: { pattern: GlobPattern; cwd: FilePath; error: Error }) => void;
} => {
  const mockGlob = registerMock({ fn: glob });

  // Addressed by [pattern, {cwd}] — a prefix/subset match against the real call's
  // `glob(pattern, {cwd, absolute, ignore})`, so a broker that computes the wrong cwd calls glob
  // with an address nothing here answers, instead of silently matching on pattern alone.
  return {
    returns: ({
      pattern,
      cwd,
      files,
    }: {
      pattern: GlobPattern;
      cwd: FilePath;
      files: readonly FilePath[];
    }): void => {
      mockGlob.calledWith([pattern, { cwd: String(cwd) }]).resolves([...files]);
    },
    returnsNonArray: ({
      pattern,
      cwd,
      files,
    }: {
      pattern: GlobPattern;
      cwd: FilePath;
      files: readonly FilePath[];
    }): void => {
      // Simulates glob v7 behavior: returns a non-iterable Glob instance on first call, then
      // provides results via callback on the second (fallback) call. Both calls share the same
      // pattern and cwd, so each response is staged once-for that key and consumed in
      // registration order.
      const globInstance = { constructor: { name: 'Glob' } };
      mockGlob.onceFor([pattern, { cwd: String(cwd) }]).resolves(globInstance);
      const v7Handler = (...args: unknown[]): void => {
        const callback = args[2] as (error: null, matches: readonly FilePath[]) => void;
        callback(null, [...files]);
      };
      mockGlob.onceFor([pattern, { cwd: String(cwd) }]).implement(v7Handler);
    },
    throws: ({
      pattern,
      cwd,
      error,
    }: {
      pattern: GlobPattern;
      cwd: FilePath;
      error: Error;
    }): void => {
      mockGlob.calledWith([pattern, { cwd: String(cwd) }]).rejects(error);
    },
    throwsNonArray: ({
      pattern,
      cwd,
      error,
    }: {
      pattern: GlobPattern;
      cwd: FilePath;
      error: Error;
    }): void => {
      const globInstance = { constructor: { name: 'Glob' } };
      mockGlob.onceFor([pattern, { cwd: String(cwd) }]).resolves(globInstance);
      const v7Handler = (...args: unknown[]): void => {
        const callback = args[2] as (error: Error, matches: null) => void;
        callback(error, null);
      };
      mockGlob.onceFor([pattern, { cwd: String(cwd) }]).implement(v7Handler);
    },
  };
};
