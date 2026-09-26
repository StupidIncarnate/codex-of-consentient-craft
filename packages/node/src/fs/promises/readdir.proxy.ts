import { readdir } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const readdirProxy = (): {
  returns: (params: { path: string; names: string[] }) => void;
  rejects: (params: { path: string; error: unknown }) => void;
} => {
  const handle = registerMock({ fn: readdir });

  return {
    returns: ({ path, names }: { path: string; names: string[] }): void => {
      handle.calledWith([path]).resolves(names);
    },
    rejects: ({ path, error }: { path: string; error: unknown }): void => {
      handle.calledWith([path]).rejects(error);
    },
  };
};
