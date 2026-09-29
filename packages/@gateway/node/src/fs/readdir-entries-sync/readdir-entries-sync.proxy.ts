import { readdirSync } from 'fs';
import type { Dirent } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { PathMatcher } from '../../gateway-test-support/path-matcher';
import { DirentStub } from './dirent.stub';

export const readdirEntriesSyncProxy = (): {
  returns: (params: {
    path: string;
    entries: readonly { name: string; kind: 'file' | 'directory' | 'symlink' | 'other' }[];
  }) => void;
  throws: (params: { path: string; error: NodeJS.ErrnoException }) => void;
  returnsMatchingPath: (params: {
    path: PathMatcher;
    entries: readonly { name: string; kind: 'file' | 'directory' | 'symlink' | 'other' }[];
  }) => void;
  throwsMatchingPath: (params: { path: PathMatcher; error: NodeJS.ErrnoException }) => void;
  implementsRawMatchingPath: (params: {
    path: PathMatcher;
    fn: (path: string) => Dirent[];
  }) => void;
  getCallsFor: (params: { path: PathMatcher }) => readonly unknown[][];
} => {
  const handle = registerMock({ fn: readdirSync });

  return {
    returns: ({
      path,
      entries,
    }: {
      path: string;
      entries: readonly { name: string; kind: 'file' | 'directory' | 'symlink' | 'other' }[];
    }): void => {
      const dirents = entries.map((entry) => DirentStub({ name: entry.name, kind: entry.kind }));
      handle.calledWith([path, { withFileTypes: true }]).returns(dirents);
    },
    // `.implement()`, not `.throws()` — see read-file-sync.proxy.ts for why: `.throws()`
    // coerces a non-`instanceof Error` value through `new Error(String(val))`, destroying
    // FsErrorStub's prototype-less `code`/`path`/`syscall` shape.
    throws: ({ path, error }: { path: string; error: NodeJS.ErrnoException }): void => {
      handle.calledWith([path, { withFileTypes: true }]).implement((): never => {
        throw error;
      });
    },
    returnsMatchingPath: ({
      path,
      entries,
    }: {
      path: PathMatcher;
      entries: readonly { name: string; kind: 'file' | 'directory' | 'symlink' | 'other' }[];
    }): void => {
      const dirents = entries.map((entry) => DirentStub({ name: entry.name, kind: entry.kind }));
      handle.calledWith([path, { withFileTypes: true }]).returns(dirents);
    },
    throwsMatchingPath: ({
      path,
      error,
    }: {
      path: PathMatcher;
      error: NodeJS.ErrnoException;
    }): void => {
      handle.calledWith([path, { withFileTypes: true }]).implement((): never => {
        throw error;
      });
    },
    // Answers the RAW `readdirSync` with `Dirent[]`, so the wrapper's own `{ name, kind }` map still
    // runs. Addressed by the path alone, one argument short of `[path, { withFileTypes: true }]`, so
    // an exact `returns`/`throws` stage outscores it and wins for its path.
    implementsRawMatchingPath: ({
      path,
      fn,
    }: {
      path: PathMatcher;
      fn: (path: string) => Dirent[];
    }): void => {
      handle
        .calledWith([path])
        .implement((calledPath: unknown): Dirent[] => fn(String(calledPath)));
    },
    getCallsFor: ({ path }: { path: PathMatcher }): readonly unknown[][] =>
      handle.callsMatching([path]),
  };
};
