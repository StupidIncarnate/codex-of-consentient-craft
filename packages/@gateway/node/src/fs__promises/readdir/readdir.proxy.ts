import { readdir } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { FsErrorStub } from '../../fs/is-fs-error/fs-error.stub';

export const readdirProxy = (): {
  returns: (params: { path: string; names: string[] }) => void;
  missing: (params: { path: string }) => void;
  denied: (params: { path: string }) => void;
  notADirectory: (params: { path: string }) => void;
} => {
  const handle = registerMock({ fn: readdir });

  return {
    returns: ({ path, names }: { path: string; names: string[] }): void => {
      handle.calledWith([path]).resolves(names);
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
