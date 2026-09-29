import { readFile } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { FsErrorStub } from '../../fs/is-fs-error/fs-error.stub';
import type { FsError } from '../../fs/is-fs-error/fs-error';
import type { PathMatcher } from '../../gateway-test-support/path-matcher';

export const readFileProxy = (): {
  returns: (params: { path: string; contents: string }) => void;
  missing: (params: { path: string }) => void;
  denied: (params: { path: string }) => void;
  isDirectory: (params: { path: string }) => void;
  notADirectory: (params: { path: string }) => void;
  returnsMatchingPath: (params: { path: PathMatcher; contents: string }) => void;
  throwsMatchingPath: (params: { path: PathMatcher; error: FsError }) => void;
  returnsOnce: (params: { path: PathMatcher; contents: string }) => void;
  throwsOnce: (params: { path: PathMatcher; error: FsError }) => void;
  returnsOnceFallback: (params: { path: PathMatcher; contents: string }) => void;
  throwsOnceFallback: (params: { path: PathMatcher; error: FsError }) => void;
  getCallsFor: (params: { path: PathMatcher }) => readonly unknown[][];
} => {
  const handle = registerMock({ fn: readFile });

  return {
    returns: ({ path, contents }: { path: string; contents: string }): void => {
      handle.calledWith([path, 'utf8']).resolves(contents);
    },
    missing: ({ path }: { path: string }): void => {
      handle.calledWith([path, 'utf8']).rejects(FsErrorStub({ code: 'ENOENT', path }));
    },
    denied: ({ path }: { path: string }): void => {
      handle.calledWith([path, 'utf8']).rejects(FsErrorStub({ code: 'EACCES', path }));
    },
    isDirectory: ({ path }: { path: string }): void => {
      handle.calledWith([path, 'utf8']).rejects(FsErrorStub({ code: 'EISDIR', path }));
    },
    notADirectory: ({ path }: { path: string }): void => {
      handle.calledWith([path, 'utf8']).rejects(FsErrorStub({ code: 'ENOTDIR', path }));
    },
    returnsMatchingPath: ({ path, contents }: { path: PathMatcher; contents: string }): void => {
      handle.calledWith([path, 'utf8']).resolves(contents);
    },
    throwsMatchingPath: ({ path, error }: { path: PathMatcher; error: FsError }): void => {
      handle.calledWith([path, 'utf8']).rejects(error);
    },
    // One-shot stages, consumed in the order staged; at equal specificity a live one-shot outranks
    // a sticky `returns`, so a test reads a path once with one answer and again with the next.
    returnsOnce: ({ path, contents }: { path: PathMatcher; contents: string }): void => {
      handle.onceFor([path, 'utf8']).resolves(contents);
    },
    throwsOnce: ({ path, error }: { path: PathMatcher; error: FsError }): void => {
      handle.onceFor([path, 'utf8']).rejects(error);
    },
    // One-shot stages addressed by the path alone, one argument short of the call's
    // `[path, 'utf8']`: every exact and `...MatchingPath` stage (sticky or one-shot) outranks them,
    // so a caller that queues reads for paths it cannot name never answers a read another proxy
    // addressed exactly. Consumed in the order staged.
    returnsOnceFallback: ({ path, contents }: { path: PathMatcher; contents: string }): void => {
      handle.onceFor([path]).resolves(contents);
    },
    throwsOnceFallback: ({ path, error }: { path: PathMatcher; error: FsError }): void => {
      handle.onceFor([path]).rejects(error);
    },
    getCallsFor: ({ path }: { path: PathMatcher }): readonly unknown[][] =>
      handle.callsMatching([path]),
  };
};
