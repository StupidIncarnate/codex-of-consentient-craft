import { readFileSync } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { PathMatcher } from '../../gateway-test-support/path-matcher';

export const readFileSyncProxy = (): {
  returns: ({ path, contents }: { path: string; contents: string }) => void;
  throws: ({ path, error }: { path: string; error: NodeJS.ErrnoException }) => void;
  returnsMatchingPath: ({ path, contents }: { path: PathMatcher; contents: string }) => void;
  throwsMatchingPath: ({
    path,
    error,
  }: {
    path: PathMatcher;
    error: NodeJS.ErrnoException;
  }) => void;
  implementsMatchingPath: ({
    path,
    fn,
  }: {
    path: PathMatcher;
    fn: (path: string) => string;
  }) => void;
  getCallsFor: (params: { path: PathMatcher }) => readonly unknown[][];
} => {
  const handle = registerMock({ fn: readFileSync });

  return {
    returns: ({ path, contents }: { path: string; contents: string }): void => {
      handle.calledWith([path, 'utf8']).returns(contents);
    },
    // `.implement()`, not `.throws()`: `.throws()` coerces any value that is not
    // `instanceof Error` through `new Error(String(val))`, which destroys FsErrorStub's
    // prototype-less shape (its whole `code`/`path`/`syscall`) before this wrapper's own
    // `isFsError` check ever runs. `.implement()` throws the staged value untouched.
    throws: ({ path, error }: { path: string; error: NodeJS.ErrnoException }): void => {
      handle.calledWith([path, 'utf8']).implement((): never => {
        throw error;
      });
    },
    returnsMatchingPath: ({ path, contents }: { path: PathMatcher; contents: string }): void => {
      handle.calledWith([path, 'utf8']).returns(contents);
    },
    throwsMatchingPath: ({
      path,
      error,
    }: {
      path: PathMatcher;
      error: NodeJS.ErrnoException;
    }): void => {
      handle.calledWith([path, 'utf8']).implement((): never => {
        throw error;
      });
    },
    // Addressed by the path alone, one argument short of the call's `[path, 'utf8']`, so it scores
    // below every `returns`/`throws`/`...MatchingPath` stage and an exact stage still wins.
    implementsMatchingPath: ({
      path,
      fn,
    }: {
      path: PathMatcher;
      fn: (path: string) => string;
    }): void => {
      handle.calledWith([path]).implement((calledPath: unknown): string => fn(String(calledPath)));
    },
    getCallsFor: ({ path }: { path: PathMatcher }): readonly unknown[][] =>
      handle.callsMatching([path]),
  };
};
