import { statfs } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { FsErrorStub } from '../../fs/is-fs-error/fs-error.stub';
import type { FsError } from '../../fs/is-fs-error/fs-error';
import { StatsFsStub } from '../../fs/stats-fs/stats-fs.stub';
import type { PathMatcher } from '../path-matcher/path-matcher';

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
      handle.calledWith([path]).resolves(StatsFsStub({ bavail, bsize }));
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
      handle.calledWith([path]).resolves(StatsFsStub({ bavail, bsize }));
    },
    throwsMatchingPath: ({ path, error }: { path: PathMatcher; error: FsError }): void => {
      handle.calledWith([path]).rejects(error);
    },
    getCallsFor: ({ path }: { path: PathMatcher }): readonly unknown[][] =>
      handle.callsMatching([path]),
  };
};
