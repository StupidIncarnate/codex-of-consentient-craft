import { readFile } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const readFileProxy = (): {
  returns: (params: { path: string; contents: string }) => void;
  rejects: (params: { path: string; error: unknown }) => void;
} => {
  const handle = registerMock({ fn: readFile });

  return {
    returns: ({ path, contents }: { path: string; contents: string }): void => {
      handle.calledWith([path, 'utf8']).resolves(contents);
    },
    rejects: ({ path, error }: { path: string; error: unknown }): void => {
      handle.calledWith([path, 'utf8']).rejects(error);
    },
  };
};
