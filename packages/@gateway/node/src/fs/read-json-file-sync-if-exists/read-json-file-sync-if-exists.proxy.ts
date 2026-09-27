import { readFileSyncIfExistsProxy } from '../read-file-sync-if-exists/read-file-sync-if-exists.proxy';
import type { PathMatcher } from '../../gateway-test-support/path-matcher';

export const readJsonFileSyncIfExistsProxy = (): {
  returns: ({ path, json }: { path: string; json: string }) => void;
  missing: ({ path }: { path: string }) => void;
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
  const readProxy = readFileSyncIfExistsProxy();

  return {
    returns: ({ path, json }: { path: string; json: string }): void => {
      readProxy.returns({ path, contents: json });
    },
    missing: ({ path }: { path: string }): void => {
      readProxy.missing({ path });
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
