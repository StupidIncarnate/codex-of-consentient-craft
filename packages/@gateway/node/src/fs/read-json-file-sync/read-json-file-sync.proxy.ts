import { readFileSyncProxy } from '../read-file-sync/read-file-sync.proxy';
import type { PathMatcher } from '../../gateway-test-support/path-matcher';

export const readJsonFileSyncProxy = (): {
  returns: ({ path, json }: { path: string; json: string }) => void;
  throws: ({ path, error }: { path: string; error: NodeJS.ErrnoException }) => void;
  returnsMatchingPath: ({ path, json }: { path: PathMatcher; json: string }) => void;
  throwsMatchingPath: ({
    path,
    error,
  }: {
    path: PathMatcher;
    error: NodeJS.ErrnoException;
  }) => void;
  getCallsFor: (params: { path: PathMatcher }) => readonly unknown[][];
} => {
  const readProxy = readFileSyncProxy();

  return {
    returns: ({ path, json }: { path: string; json: string }): void => {
      readProxy.returns({ path, contents: json });
    },
    throws: ({ path, error }: { path: string; error: NodeJS.ErrnoException }): void => {
      readProxy.throws({ path, error });
    },
    returnsMatchingPath: ({ path, json }: { path: PathMatcher; json: string }): void => {
      readProxy.returnsMatchingPath({ path, contents: json });
    },
    throwsMatchingPath: ({
      path,
      error,
    }: {
      path: PathMatcher;
      error: NodeJS.ErrnoException;
    }): void => {
      readProxy.throwsMatchingPath({ path, error });
    },
    getCallsFor: ({ path }: { path: PathMatcher }): readonly unknown[][] =>
      readProxy.getCallsFor({ path }),
  };
};
