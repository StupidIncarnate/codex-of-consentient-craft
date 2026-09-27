import { readFileSyncProxy } from '../read-file-sync/read-file-sync.proxy';
import { FsErrorStub } from '../is-fs-error/fs-error.stub';
import type { PathMatcher } from '../../gateway-test-support/path-matcher';

export const readFileSyncIfExistsProxy = (): {
  returns: ({ path, contents }: { path: string; contents: string }) => void;
  missing: ({ path }: { path: string }) => void;
  throws: ({ path, error }: { path: string; error: NodeJS.ErrnoException }) => void;
  returnsMatchingPath: ({ path, contents }: { path: PathMatcher; contents: string }) => void;
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
    returns: ({ path, contents }: { path: string; contents: string }): void => {
      readProxy.returns({ path, contents });
    },
    missing: ({ path }: { path: string }): void => {
      readProxy.throws({ path, error: FsErrorStub({ code: 'ENOENT', path }) });
    },
    throws: ({ path, error }: { path: string; error: NodeJS.ErrnoException }): void => {
      readProxy.throws({ path, error });
    },
    returnsMatchingPath: ({ path, contents }: { path: PathMatcher; contents: string }): void => {
      readProxy.returnsMatchingPath({ path, contents });
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
