import { realpath } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { FsErrorStub } from '../../fs/is-fs-error/fs-error.stub';
import type { FsError } from '../../fs/is-fs-error/fs-error';

// The exact-match methods above key on the caller's real path; the "MatchingPath" methods below
// also accept a PREDICATE, for a caller whose real path is computed from a value the test does
// not control (a resolved cwd, a joined path) — the same tolerant address the pre-gateway fs
// adapters offered (e.g. server/src/adapters/fs/read-file/fs-read-file-adapter.proxy.ts's
// `FilePathMatcher`).
type PathMatcher = string | ((value: unknown) => boolean);

export const realpathProxy = (): {
  returns: (params: { path: string; resolved: string }) => void;
  missing: (params: { path: string }) => void;
  denied: (params: { path: string }) => void;
  notADirectory: (params: { path: string }) => void;
  returnsMatchingPath: (params: { path: PathMatcher; resolved: string }) => void;
  throwsMatchingPath: (params: { path: PathMatcher; error: FsError }) => void;
  getCallsFor: (params: { path: PathMatcher }) => readonly unknown[][];
} => {
  const handle = registerMock({ fn: realpath });

  return {
    returns: ({ path, resolved }: { path: string; resolved: string }): void => {
      handle.calledWith([path]).resolves(resolved);
    },
    missing: ({ path }: { path: string }): void => {
      handle.calledWith([path]).rejects(FsErrorStub({ code: 'ENOENT', path }));
    },
    denied: ({ path }: { path: string }): void => {
      handle.calledWith([path]).rejects(FsErrorStub({ code: 'EACCES', path }));
    },
    notADirectory: ({ path }: { path: string }): void => {
      handle.calledWith([path]).rejects(FsErrorStub({ code: 'ENOTDIR', path }));
    },
    returnsMatchingPath: ({ path, resolved }: { path: PathMatcher; resolved: string }): void => {
      handle.calledWith([path]).resolves(resolved);
    },
    throwsMatchingPath: ({ path, error }: { path: PathMatcher; error: FsError }): void => {
      handle.calledWith([path]).rejects(error);
    },
    getCallsFor: ({ path }: { path: PathMatcher }): readonly unknown[][] =>
      handle.callsMatching([path]),
  };
};
