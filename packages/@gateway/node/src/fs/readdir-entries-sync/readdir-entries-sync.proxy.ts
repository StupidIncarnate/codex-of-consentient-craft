import { readdirSync } from 'fs';
import type { Dirent } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { PathMatcher } from '../../gateway-test-support/path-matcher';

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
      const dirents = entries.map(
        (entry) =>
          ({
            name: entry.name,
            isFile: (): boolean => entry.kind === 'file',
            isDirectory: (): boolean => entry.kind === 'directory',
            isSymbolicLink: (): boolean => entry.kind === 'symlink',
          }) as unknown as Dirent,
      );
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
      const dirents = entries.map(
        (entry) =>
          ({
            name: entry.name,
            isFile: (): boolean => entry.kind === 'file',
            isDirectory: (): boolean => entry.kind === 'directory',
            isSymbolicLink: (): boolean => entry.kind === 'symlink',
          }) as unknown as Dirent,
      );
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
    getCallsFor: ({ path }: { path: PathMatcher }): readonly unknown[][] =>
      handle.callsMatching([path]),
  };
};
