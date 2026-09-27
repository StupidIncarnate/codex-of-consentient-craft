import { readFile } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { FsErrorStub } from '../../fs/is-fs-error/fs-error.stub';

export const readFileIfExistsProxy = (): {
  returns: (params: { path: string; contents: string }) => void;
  missing: (params: { path: string }) => void;
  rejects: (params: { path: string; error: unknown }) => void;
} => {
  const handle = registerMock({ fn: readFile });

  return {
    returns: ({ path, contents }: { path: string; contents: string }): void => {
      handle.calledWith([path, 'utf8']).resolves(contents);
    },
    missing: ({ path }: { path: string }): void => {
      handle.calledWith([path, 'utf8']).rejects(FsErrorStub({ code: 'ENOENT', path }));
    },
    rejects: ({ path, error }: { path: string; error: unknown }): void => {
      handle.calledWith([path, 'utf8']).rejects(error);
    },
  };
};
