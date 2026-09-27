import { realpath } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { FsErrorStub } from '../../fs/is-fs-error/fs-error.stub';

export const realpathProxy = (): {
  returns: (params: { path: string; resolved: string }) => void;
  missing: (params: { path: string }) => void;
  denied: (params: { path: string }) => void;
  notADirectory: (params: { path: string }) => void;
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
  };
};
