import { access } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { FsErrorStub } from '../../fs/is-fs-error/fs-error.stub';

export const pathExistsProxy = (): {
  present: (params: { path: string }) => void;
  missing: (params: { path: string }) => void;
  rejects: (params: { path: string; error: unknown }) => void;
} => {
  const handle = registerMock({ fn: access });

  return {
    present: ({ path }: { path: string }): void => {
      handle.calledWith([path]).resolves(undefined);
    },
    missing: ({ path }: { path: string }): void => {
      handle.calledWith([path]).rejects(FsErrorStub({ code: 'ENOENT', path }));
    },
    rejects: ({ path, error }: { path: string; error: unknown }): void => {
      handle.calledWith([path]).rejects(error);
    },
  };
};
