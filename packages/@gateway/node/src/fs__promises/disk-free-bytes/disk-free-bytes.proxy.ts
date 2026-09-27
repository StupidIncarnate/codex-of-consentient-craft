import { statfs } from 'fs/promises';
import type { StatsFs } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { FsErrorStub } from '../../fs/is-fs-error/fs-error.stub';

export const diskFreeBytesProxy = (): {
  returns: (params: { path: string; bavail: number; bsize: number }) => void;
  missing: (params: { path: string }) => void;
  denied: (params: { path: string }) => void;
} => {
  const handle = registerMock({ fn: statfs });

  return {
    returns: ({ path, bavail, bsize }: { path: string; bavail: number; bsize: number }): void => {
      handle.calledWith([path]).resolves({ bavail, bsize } as unknown as StatsFs);
    },
    missing: ({ path }: { path: string }): void => {
      handle.calledWith([path]).rejects(FsErrorStub({ code: 'ENOENT', path }));
    },
    denied: ({ path }: { path: string }): void => {
      handle.calledWith([path]).rejects(FsErrorStub({ code: 'EACCES', path }));
    },
  };
};
