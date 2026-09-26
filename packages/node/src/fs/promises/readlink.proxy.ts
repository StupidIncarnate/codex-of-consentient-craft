import { readlink } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const readlinkProxy = (): {
  returns: (params: { path: string; target: string }) => void;
  rejects: (params: { path: string; error: unknown }) => void;
} => {
  const handle = registerMock({ fn: readlink });

  return {
    returns: ({ path, target }: { path: string; target: string }): void => {
      handle.calledWith([path]).resolves(target);
    },
    rejects: ({ path, error }: { path: string; error: unknown }): void => {
      handle.calledWith([path]).rejects(error);
    },
  };
};
