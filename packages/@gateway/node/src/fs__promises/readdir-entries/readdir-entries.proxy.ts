import { readdir } from 'fs/promises';
import type { Dirent } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { DirentStub } from '../../fs/readdir-entries-sync/dirent.stub';
import { FsErrorStub } from '../../fs/is-fs-error/fs-error.stub';
import type { FsError } from '../../fs/is-fs-error/fs-error';
import type { PathMatcher } from '../../gateway-test-support/path-matcher';

interface DirentEntry {
  name: string;
  kind: 'file' | 'directory' | 'symlink' | 'other';
}

const buildDirents = (entries: readonly DirentEntry[]): Dirent[] =>
  entries.map((entry) => DirentStub({ name: entry.name, kind: entry.kind }));

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
