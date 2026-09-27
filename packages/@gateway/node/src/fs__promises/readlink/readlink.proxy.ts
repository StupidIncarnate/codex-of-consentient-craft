import { readlink } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { FsErrorStub } from '../../fs/is-fs-error/fs-error.stub';

export const readlinkProxy = (): {
  returns: (params: { path: string; target: string }) => void;
  missing: (params: { path: string }) => void;
  denied: (params: { path: string }) => void;
  notALink: (params: { path: string }) => void;
} => {
  const handle = registerMock({ fn: readlink });

  return {
    returns: ({ path, target }: { path: string; target: string }): void => {
      handle.calledWith([path]).resolves(target);
    },
    missing: ({ path }: { path: string }): void => {
      handle.calledWith([path]).rejects(FsErrorStub({ code: 'ENOENT', path }));
    },
    denied: ({ path }: { path: string }): void => {
      handle.calledWith([path]).rejects(FsErrorStub({ code: 'EACCES', path }));
    },
    notALink: ({ path }: { path: string }): void => {
      handle.calledWith([path]).rejects(FsErrorStub({ code: 'EINVAL', path }));
    },
  };
};
