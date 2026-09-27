import { open } from 'fs/promises';
import type { FileHandle } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { FsErrorStub } from '../../fs/is-fs-error/fs-error.stub';
import type { FsError } from '../../fs/is-fs-error/fs-error';

// The exact-match methods above key on the caller's real path; the "MatchingPath" methods below
// also accept a PREDICATE, for a caller whose real path is computed from a value the test does
// not control (a resolved cwd, a joined path) — the same tolerant address the pre-gateway fs
// adapters offered (e.g. server/src/adapters/fs/read-file/fs-read-file-adapter.proxy.ts's
// `FilePathMatcher`).
type PathMatcher = string | ((value: unknown) => boolean);

const buildFileHandle = ({ size, contents }: { size: number; contents: string }): FileHandle =>
  ({
    stat: async (): Promise<{ size: number }> => Promise.resolve({ size }),
    read: async (
      buffer: Buffer,
      offset: number,
      length: number,
      _position: number,
    ): Promise<void> => {
      buffer.write(contents, offset, length, 'utf8');
      return Promise.resolve(undefined);
    },
    close: async (): Promise<void> => Promise.resolve(undefined),
  }) as unknown as FileHandle;

export const readFileFromOffsetProxy = (): {
  returns: (params: { path: string; size: number; contents: string }) => void;
  missing: (params: { path: string }) => void;
  denied: (params: { path: string }) => void;
  isDirectory: (params: { path: string }) => void;
  returnsMatchingPath: (params: { path: PathMatcher; size: number; contents: string }) => void;
  throwsMatchingPath: (params: { path: PathMatcher; error: FsError }) => void;
  getCallsFor: (params: { path: PathMatcher }) => readonly unknown[][];
} => {
  const handle = registerMock({ fn: open });

  return {
    returns: ({ path, size, contents }: { path: string; size: number; contents: string }): void => {
      handle.calledWith([path, 'r']).resolves(buildFileHandle({ size, contents }));
    },
    missing: ({ path }: { path: string }): void => {
      handle.calledWith([path, 'r']).rejects(FsErrorStub({ code: 'ENOENT', path }));
    },
    denied: ({ path }: { path: string }): void => {
      handle.calledWith([path, 'r']).rejects(FsErrorStub({ code: 'EACCES', path }));
    },
    isDirectory: ({ path }: { path: string }): void => {
      handle.calledWith([path, 'r']).rejects(FsErrorStub({ code: 'EISDIR', path }));
    },
    returnsMatchingPath: ({
      path,
      size,
      contents,
    }: {
      path: PathMatcher;
      size: number;
      contents: string;
    }): void => {
      handle.calledWith([path, 'r']).resolves(buildFileHandle({ size, contents }));
    },
    throwsMatchingPath: ({ path, error }: { path: PathMatcher; error: FsError }): void => {
      handle.calledWith([path, 'r']).rejects(error);
    },
    getCallsFor: ({ path }: { path: PathMatcher }): readonly unknown[][] =>
      handle.callsMatching([path]),
  };
};
