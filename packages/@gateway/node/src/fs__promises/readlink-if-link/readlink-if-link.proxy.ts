import { readlink } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { FsErrorStub } from '../../fs/is-fs-error/fs-error.stub';
import type { FsError } from '../../fs/is-fs-error/fs-error';
import type { PathMatcher } from '../../gateway-test-support/path-matcher';

export const readlinkIfLinkProxy = (): {
  returns: (params: { path: string; target: string }) => void;
  missing: (params: { path: string }) => void;
  notALink: (params: { path: string }) => void;
  denied: (params: { path: string }) => void;
  returnsMatchingPath: (params: { path: PathMatcher; target: string }) => void;
  throwsMatchingPath: (params: { path: PathMatcher; error: FsError }) => void;
  getCallsFor: (params: { path: PathMatcher }) => readonly unknown[][];
} => {
  const handle = registerMock({ fn: readlink });

  return {
    returns: ({ path, target }: { path: string; target: string }): void => {
      handle.calledWith([path]).resolves(target);
    },
    missing: ({ path }: { path: string }): void => {
      handle.calledWith([path]).rejects(FsErrorStub({ code: 'ENOENT', path }));
    },
    notALink: ({ path }: { path: string }): void => {
      handle.calledWith([path]).rejects(FsErrorStub({ code: 'EINVAL', path }));
    },
    denied: ({ path }: { path: string }): void => {
      handle.calledWith([path]).rejects(FsErrorStub({ code: 'EACCES', path }));
    },
    returnsMatchingPath: ({ path, target }: { path: PathMatcher; target: string }): void => {
      handle.calledWith([path]).resolves(target);
    },
    throwsMatchingPath: ({ path, error }: { path: PathMatcher; error: FsError }): void => {
      handle.calledWith([path]).rejects(error);
    },
    getCallsFor: ({ path }: { path: PathMatcher }): readonly unknown[][] =>
      handle.callsMatching([path]),
  };
};
