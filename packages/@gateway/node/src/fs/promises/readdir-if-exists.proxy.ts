import { readdir } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { FsErrorStub } from '../fs-error.stub';

export const readdirIfExistsProxy = (): {
  returns: (params: { path: string; names: string[] }) => void;
  missing: (params: { path: string }) => void;
  rejects: (params: { path: string; error: unknown }) => void;
} => {
  const handle = registerMock({ fn: readdir });

  return {
    returns: ({ path, names }: { path: string; names: string[] }): void => {
      handle.calledWith([path]).resolves(names);
    },
    missing: ({ path }: { path: string }): void => {
      handle.calledWith([path]).rejects(FsErrorStub({ code: 'ENOENT', path }));
    },
    rejects: ({ path, error }: { path: string; error: unknown }): void => {
      handle.calledWith([path]).rejects(error);
    },
  };
};
