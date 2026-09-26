import { realpath } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const realpathProxy = (): {
  returns: (params: { path: string; resolved: string }) => void;
  rejects: (params: { path: string; error: unknown }) => void;
} => {
  const handle = registerMock({ fn: realpath });

  return {
    returns: ({ path, resolved }: { path: string; resolved: string }): void => {
      handle.calledWith([path]).resolves(resolved);
    },
    rejects: ({ path, error }: { path: string; error: unknown }): void => {
      handle.calledWith([path]).rejects(error);
    },
  };
};
