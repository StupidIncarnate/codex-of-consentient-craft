import { statSync } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { Stats } from 'fs';
import type { PathMatcher } from '../../gateway-test-support/path-matcher';

type StatKind = 'file' | 'directory' | 'symlink' | 'other';

export const statSyncProxy = (): {
  returns: ({
    path,
    kind,
    sizeBytes,
    modifiedAtMs,
    inode,
  }: {
    path: string;
    kind: StatKind;
    sizeBytes: number;
    modifiedAtMs: number;
    inode?: number;
  }) => void;
  throws: ({ path, error }: { path: string; error: NodeJS.ErrnoException }) => void;
  returnsMatchingPath: (params: {
    path: PathMatcher;
    kind: StatKind;
    sizeBytes: number;
    modifiedAtMs: number;
    inode?: number;
  }) => void;
  throwsMatchingPath: ({
    path,
    error,
  }: {
    path: PathMatcher;
    error: NodeJS.ErrnoException;
  }) => void;
  getCallsFor: (params: { path: PathMatcher }) => readonly unknown[][];
} => {
  const handle = registerMock({ fn: statSync });

  return {
    // `inode` defaults to 0 when a test does not care which inode the path has.
    returns: ({
      path,
      kind,
      sizeBytes,
      modifiedAtMs,
      inode = 0,
    }: {
      path: string;
      kind: StatKind;
      sizeBytes: number;
      modifiedAtMs: number;
      inode?: number;
    }): void => {
      const stats: Pick<
        Stats,
        'isDirectory' | 'isFile' | 'isSymbolicLink' | 'size' | 'mtimeMs' | 'ino'
      > = {
        isDirectory: (): boolean => kind === 'directory',
        isFile: (): boolean => kind === 'file',
        isSymbolicLink: (): boolean => kind === 'symlink',
        size: sizeBytes,
        mtimeMs: modifiedAtMs,
        ino: inode,
      };
      handle.calledWith([path]).returns(stats as Stats);
    },
    // `.implement()`, not `.throws()` — see read-file-sync.proxy.ts for why: `.throws()`
    // coerces a non-`instanceof Error` value through `new Error(String(val))`, destroying
    // FsErrorStub's prototype-less `code`/`path`/`syscall` shape.
    throws: ({ path, error }: { path: string; error: NodeJS.ErrnoException }): void => {
      handle.calledWith([path]).implement((): never => {
        throw error;
      });
    },
    returnsMatchingPath: ({
      path,
      kind,
      sizeBytes,
      modifiedAtMs,
      inode = 0,
    }: {
      path: PathMatcher;
      kind: StatKind;
      sizeBytes: number;
      modifiedAtMs: number;
      inode?: number;
    }): void => {
      const stats: Pick<
        Stats,
        'isDirectory' | 'isFile' | 'isSymbolicLink' | 'size' | 'mtimeMs' | 'ino'
      > = {
        isDirectory: (): boolean => kind === 'directory',
        isFile: (): boolean => kind === 'file',
        isSymbolicLink: (): boolean => kind === 'symlink',
        size: sizeBytes,
        mtimeMs: modifiedAtMs,
        ino: inode,
      };
      handle.calledWith([path]).returns(stats as Stats);
    },
    throwsMatchingPath: ({
      path,
      error,
    }: {
      path: PathMatcher;
      error: NodeJS.ErrnoException;
    }): void => {
      handle.calledWith([path]).implement((): never => {
        throw error;
      });
    },
    getCallsFor: ({ path }: { path: PathMatcher }): readonly unknown[][] =>
      handle.callsMatching([path]),
  };
};
