import { readFile } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const readJsonFileProxy = (): {
  returnsRaw: (params: { path: string; rawContents: string }) => void;
  rejects: (params: { path: string; error: unknown }) => void;
} => {
  const handle = registerMock({ fn: readFile });

  return {
    returnsRaw: ({ path, rawContents }: { path: string; rawContents: string }): void => {
      handle.calledWith([path, 'utf8']).resolves(rawContents);
    },
    rejects: ({ path, error }: { path: string; error: unknown }): void => {
      handle.calledWith([path, 'utf8']).rejects(error);
    },
  };
};
