import { readFile } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const readFileBytesProxy = (): {
  returns: (params: { path: string; bytes: Uint8Array }) => void;
  rejects: (params: { path: string; error: unknown }) => void;
} => {
  const handle = registerMock({ fn: readFile });

  return {
    returns: ({ path, bytes }: { path: string; bytes: Uint8Array }): void => {
      handle.calledWith([path]).resolves(bytes);
    },
    rejects: ({ path, error }: { path: string; error: unknown }): void => {
      handle.calledWith([path]).rejects(error);
    },
  };
};
