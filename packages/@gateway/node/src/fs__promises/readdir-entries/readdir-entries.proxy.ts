import { readdir } from 'fs/promises';
import type { Dirent } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { FsErrorStub } from '../../fs/is-fs-error/fs-error.stub';
import type { FsError } from '../../fs/is-fs-error/fs-error';

// The exact-match methods above key on the caller's real path; the "MatchingPath" methods below
// also accept a PREDICATE, for a caller whose real path is computed from a value the test does
// not control (a resolved cwd, a joined path) — the same tolerant address the pre-gateway fs
// adapters offered (e.g. server/src/adapters/fs/read-file/fs-read-file-adapter.proxy.ts's
// `FilePathMatcher`).
type PathMatcher = string | ((value: unknown) => boolean);

interface DirentEntry {
  name: string;
  kind: 'file' | 'directory' | 'symlink' | 'other';
}

const buildDirents = (entries: readonly DirentEntry[]): Dirent[] =>
  entries.map(
    (entry) =>
      ({
        name: entry.name,
        isFile: (): boolean => entry.kind === 'file',
        isDirectory: (): boolean => entry.kind === 'directory',
        isSymbolicLink: (): boolean => entry.kind === 'symlink',
      }) as unknown as Dirent,
  );

export const readdirEntriesProxy = (): {
  returns: (params: { path: string; entries: readonly DirentEntry[] }) => void;
  missing: (params: { path: string }) => void;
  denied: (params: { path: string }) => void;
  notADirectory: (params: { path: string }) => void;
  returnsMatchingPath: (params: { path: PathMatcher; entries: readonly DirentEntry[] }) => void;
  throwsMatchingPath: (params: { path: PathMatcher; error: FsError }) => void;
  getCallsFor: (params: { path: PathMatcher }) => readonly unknown[][];
} => {
  const handle = registerMock({ fn: readdir });

  return {
    returns: ({ path, entries }: { path: string; entries: readonly DirentEntry[] }): void => {
      handle.calledWith([path, { withFileTypes: true }]).resolves(buildDirents(entries));
    },
    missing: ({ path }: { path: string }): void => {
      handle
        .calledWith([path, { withFileTypes: true }])
        .rejects(FsErrorStub({ code: 'ENOENT', path }));
    },
    denied: ({ path }: { path: string }): void => {
      handle
        .calledWith([path, { withFileTypes: true }])
        .rejects(FsErrorStub({ code: 'EACCES', path }));
    },
    notADirectory: ({ path }: { path: string }): void => {
      handle
        .calledWith([path, { withFileTypes: true }])
        .rejects(FsErrorStub({ code: 'ENOTDIR', path }));
    },
    returnsMatchingPath: ({
      path,
      entries,
    }: {
      path: PathMatcher;
      entries: readonly DirentEntry[];
    }): void => {
      handle.calledWith([path, { withFileTypes: true }]).resolves(buildDirents(entries));
    },
    throwsMatchingPath: ({ path, error }: { path: PathMatcher; error: FsError }): void => {
      handle.calledWith([path, { withFileTypes: true }]).rejects(error);
    },
    getCallsFor: ({ path }: { path: PathMatcher }): readonly unknown[][] =>
      handle.callsMatching([path]),
  };
};
