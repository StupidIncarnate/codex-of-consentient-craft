import { statfs } from 'fs/promises';
import type { StatsFs } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const diskFreeBytesProxy = (): {
  returns: (params: { path: string; bavail: number; bsize: number }) => void;
  rejects: (params: { path: string; error: unknown }) => void;
} => {
  const handle = registerMock({ fn: statfs });

  return {
    returns: ({ path, bavail, bsize }: { path: string; bavail: number; bsize: number }): void => {
      handle.calledWith([path]).resolves({ bavail, bsize } as unknown as StatsFs);
    },
    rejects: ({ path, error }: { path: string; error: unknown }): void => {
      handle.calledWith([path]).rejects(error);
    },
  };
};
