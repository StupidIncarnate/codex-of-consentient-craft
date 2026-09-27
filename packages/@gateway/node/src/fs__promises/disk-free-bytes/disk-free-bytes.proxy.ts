import { statfs } from 'fs/promises';
import type { StatsFs } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { FsErrorStub } from '../../fs/is-fs-error/fs-error.stub';
import type { FsError } from '../../fs/is-fs-error/fs-error';

// The exact-match methods above key on the caller's real path; the "MatchingPath" methods below
// also accept a PREDICATE, for a caller whose real path is computed from a value the test does
// not control (a resolved cwd, a joined path) — the same tolerant address the pre-gateway fs
// adapters offered (e.g. server/src/adapters/fs/read-file/fs-read-file-adapter.proxy.ts's
// `FilePathMatcher`).
type PathMatcher = string | ((value: unknown) => boolean);

export const diskFreeBytesProxy = (): {
  returns: (params: { path: string; bavail: number; bsize: number }) => void;
  missing: (params: { path: string }) => void;
  denied: (params: { path: string }) => void;
  returnsMatchingPath: (params: { path: PathMatcher; bavail: number; bsize: number }) => void;
  throwsMatchingPath: (params: { path: PathMatcher; error: FsError }) => void;
  getCallsFor: (params: { path: PathMatcher }) => readonly unknown[][];
} => {
  const handle = registerMock({ fn: statfs });

  return {
    returns: ({ path, bavail, bsize }: { path: string; bavail: number; bsize: number }): void => {
      handle.calledWith([path]).resolves({ bavail, bsize } as unknown as StatsFs);
    },
    missing: ({ path }: { path: string }): void => {
      handle.calledWith([path]).rejects(FsErrorStub({ code: 'ENOENT', path }));
    },
    denied: ({ path }: { path: string }): void => {
      handle.calledWith([path]).rejects(FsErrorStub({ code: 'EACCES', path }));
    },
    returnsMatchingPath: ({
      path,
      bavail,
      bsize,
    }: {
      path: PathMatcher;
      bavail: number;
      bsize: number;
    }): void => {
      handle.calledWith([path]).resolves({ bavail, bsize } as unknown as StatsFs);
    },
    throwsMatchingPath: ({ path, error }: { path: PathMatcher; error: FsError }): void => {
      handle.calledWith([path]).rejects(error);
    },
    getCallsFor: ({ path }: { path: PathMatcher }): readonly unknown[][] =>
      handle.callsMatching([path]),
  };
};
