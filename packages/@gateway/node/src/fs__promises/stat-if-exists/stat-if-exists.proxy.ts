import { stat } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { FsErrorStub } from '../../fs/is-fs-error/fs-error.stub';
import type { FsError } from '../../fs/is-fs-error/fs-error';
import { StatsStub } from '../../fs/stats/stats.stub';

// The exact-match methods above key on the caller's real path; the "MatchingPath" methods below
// also accept a PREDICATE, for a caller whose real path is computed from a value the test does
// not control (a resolved cwd, a joined path) — the same tolerant address the pre-gateway fs
// adapters offered (e.g. server/src/adapters/fs/read-file/fs-read-file-adapter.proxy.ts's
// `FilePathMatcher`).
type PathMatcher = string | ((value: unknown) => boolean);
type StatKind = 'file' | 'directory' | 'symlink' | 'other';

export const statIfExistsProxy = (): {
  returnsFile: (params: { path: string; sizeBytes: number; modifiedAtMs: number }) => void;
  missing: (params: { path: string }) => void;
  denied: (params: { path: string }) => void;
  returnsMatchingPath: (params: {
    path: PathMatcher;
    kind: StatKind;
    sizeBytes: number;
    modifiedAtMs: number;
  }) => void;
  throwsMatchingPath: (params: { path: PathMatcher; error: FsError }) => void;
  getCallsFor: (params: { path: PathMatcher }) => readonly unknown[][];
} => {
  const handle = registerMock({ fn: stat });

  return {
    returnsFile: ({
      path,
      sizeBytes,
      modifiedAtMs,
    }: {
      path: string;
      sizeBytes: number;
      modifiedAtMs: number;
    }): void => {
      handle.calledWith([path]).resolves(StatsStub({ kind: 'file', sizeBytes, modifiedAtMs }));
    },
    missing: ({ path }: { path: string }): void => {
      handle.calledWith([path]).rejects(FsErrorStub({ code: 'ENOENT', path }));
    },
    denied: ({ path }: { path: string }): void => {
      handle.calledWith([path]).rejects(FsErrorStub({ code: 'EACCES', path }));
    },
    returnsMatchingPath: ({
      path,
      kind,
      sizeBytes,
      modifiedAtMs,
    }: {
      path: PathMatcher;
      kind: StatKind;
      sizeBytes: number;
      modifiedAtMs: number;
    }): void => {
      handle.calledWith([path]).resolves(StatsStub({ kind, sizeBytes, modifiedAtMs }));
    },
    throwsMatchingPath: ({ path, error }: { path: PathMatcher; error: FsError }): void => {
      handle.calledWith([path]).rejects(error);
    },
    getCallsFor: ({ path }: { path: PathMatcher }): readonly unknown[][] =>
      handle.callsMatching([path]),
  };
};
