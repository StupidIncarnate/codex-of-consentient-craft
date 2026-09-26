import { readlink } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { FsErrorStub } from '../fs-error.stub';

export const readlinkIfLinkProxy = (): {
  returns: (params: { path: string; target: string }) => void;
  missing: (params: { path: string }) => void;
  notALink: (params: { path: string }) => void;
  rejects: (params: { path: string; error: unknown }) => void;
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
    rejects: ({ path, error }: { path: string; error: unknown }): void => {
      handle.calledWith([path]).rejects(error);
    },
  };
};
