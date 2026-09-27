import { readFile } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { FsErrorStub } from '../../fs/is-fs-error/fs-error.stub';
import type { FsError } from '../../fs/is-fs-error/fs-error';

// The exact-match methods above key on the caller's real path; the "MatchingPath" methods below
// also accept a PREDICATE, for a caller whose real path is computed from a value the test does
// not control (a resolved cwd, a joined path) — the same tolerant address the pre-gateway fs
// adapters offered (e.g. server/src/adapters/fs/read-file/fs-read-file-adapter.proxy.ts's
// `FilePathMatcher`).
type PathMatcher = string | ((value: unknown) => boolean);

export const readJsonFileIfExistsProxy = (): {
  returnsRaw: (params: { path: string; rawContents: string }) => void;
  missing: (params: { path: string }) => void;
  denied: (params: { path: string }) => void;
  returnsRawMatchingPath: (params: { path: PathMatcher; rawContents: string }) => void;
  throwsMatchingPath: (params: { path: PathMatcher; error: FsError }) => void;
  getCallsFor: (params: { path: PathMatcher }) => readonly unknown[][];
} => {
  const handle = registerMock({ fn: readFile });

  return {
    returnsRaw: ({ path, rawContents }: { path: string; rawContents: string }): void => {
      handle.calledWith([path, 'utf8']).resolves(rawContents);
    },
    missing: ({ path }: { path: string }): void => {
      handle.calledWith([path, 'utf8']).rejects(FsErrorStub({ code: 'ENOENT', path }));
    },
    // syscall: 'open' — real callers of this proxy (config/hooks/mcp install responders) assert
    // the derived error message text, which names the real Node syscall readFile fails inside.
    denied: ({ path }: { path: string }): void => {
      handle
        .calledWith([path, 'utf8'])
        .rejects(FsErrorStub({ code: 'EACCES', path, syscall: 'open' }));
    },
    returnsRawMatchingPath: ({
      path,
      rawContents,
    }: {
      path: PathMatcher;
      rawContents: string;
    }): void => {
      handle.calledWith([path, 'utf8']).resolves(rawContents);
    },
    throwsMatchingPath: ({ path, error }: { path: PathMatcher; error: FsError }): void => {
      handle.calledWith([path, 'utf8']).rejects(error);
    },
    getCallsFor: ({ path }: { path: PathMatcher }): readonly unknown[][] =>
      handle.callsMatching([path]),
  };
};
