import { readFile } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { FsErrorStub } from '../../fs/is-fs-error/fs-error.stub';
import type { FsError } from '../../fs/is-fs-error/fs-error';
import type { PathMatcher } from '../../gateway-test-support/path-matcher';

export const readNonEmptyLinesProxy = (): {
  returnsRaw: (params: { path: string; rawContents: string }) => void;
  missing: (params: { path: string }) => void;
  denied: (params: { path: string }) => void;
  returnsRawMatchingPath: (params: { path: PathMatcher; rawContents: string }) => void;
  throwsMatchingPath: (params: { path: PathMatcher; error: FsError }) => void;
  returnsRawOnce: (params: { path: string; rawContents: string }) => void;
  throwsOnce: (params: { path: string; error: FsError }) => void;
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
    denied: ({ path }: { path: string }): void => {
      handle.calledWith([path, 'utf8']).rejects(FsErrorStub({ code: 'EACCES', path }));
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
    // One-shot: answers the FIRST read of `path` only, then steps aside so a sticky staging (or
    // the next one-shot) answers the rest. Outranks a sticky staging at the same path.
    returnsRawOnce: ({ path, rawContents }: { path: string; rawContents: string }): void => {
      handle.onceFor([path, 'utf8']).resolves(rawContents);
    },
    throwsOnce: ({ path, error }: { path: string; error: FsError }): void => {
      handle.onceFor([path, 'utf8']).rejects(error);
    },
    getCallsFor: ({ path }: { path: PathMatcher }): readonly unknown[][] =>
      handle.callsMatching([path]),
  };
};
