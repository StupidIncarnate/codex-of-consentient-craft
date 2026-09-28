import { readFileSync } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { FsErrorStub } from '../is-fs-error/fs-error.stub';
import type { FsError } from '../is-fs-error/fs-error';
import type { PathMatcher } from '../../gateway-test-support/path-matcher';

export const readFileBytesSyncProxy = (): {
  returns: (params: { path: string; bytes: Buffer }) => void;
  missing: (params: { path: string }) => void;
  denied: (params: { path: string }) => void;
  isDirectory: (params: { path: string }) => void;
  notADirectory: (params: { path: string }) => void;
  throws: (params: { path: string; error: FsError }) => void;
  returnsMatchingPath: (params: { path: PathMatcher; bytes: Buffer }) => void;
  throwsMatchingPath: (params: { path: PathMatcher; error: FsError }) => void;
  getCallsFor: (params: { path: PathMatcher }) => readonly unknown[][];
} => {
  const handle = registerMock({ fn: readFileSync });

  return {
    returns: ({ path, bytes }: { path: string; bytes: Buffer }): void => {
      handle.calledWith([path]).returns(bytes);
    },
    missing: ({ path }: { path: string }): void => {
      handle.calledWith([path]).implement((): never => {
        throw FsErrorStub({ code: 'ENOENT', path });
      });
    },
    denied: ({ path }: { path: string }): void => {
      handle.calledWith([path]).implement((): never => {
        throw FsErrorStub({ code: 'EACCES', path });
      });
    },
    isDirectory: ({ path }: { path: string }): void => {
      handle.calledWith([path]).implement((): never => {
        throw FsErrorStub({ code: 'EISDIR', path });
      });
    },
    notADirectory: ({ path }: { path: string }): void => {
      handle.calledWith([path]).implement((): never => {
        throw FsErrorStub({ code: 'ENOTDIR', path });
      });
    },
    throws: ({ path, error }: { path: string; error: FsError }): void => {
      handle.calledWith([path]).implement((): never => {
        throw error;
      });
    },
    returnsMatchingPath: ({ path, bytes }: { path: PathMatcher; bytes: Buffer }): void => {
      handle.calledWith([path]).returns(bytes);
    },
    throwsMatchingPath: ({ path, error }: { path: PathMatcher; error: FsError }): void => {
      handle.calledWith([path]).implement((): never => {
        throw error;
      });
    },
    getCallsFor: ({ path }: { path: PathMatcher }): readonly unknown[][] =>
      handle.callsMatching([path]),
  };
};
