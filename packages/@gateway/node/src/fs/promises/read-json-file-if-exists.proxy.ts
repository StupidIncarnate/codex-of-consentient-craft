import { readFile } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { FsErrorStub } from '../fs-error.stub';

export const readJsonFileIfExistsProxy = (): {
  returnsRaw: (params: { path: string; rawContents: string }) => void;
  missing: (params: { path: string }) => void;
  rejects: (params: { path: string; error: unknown }) => void;
} => {
  const handle = registerMock({ fn: readFile });

  return {
    returnsRaw: ({ path, rawContents }: { path: string; rawContents: string }): void => {
      handle.calledWith([path, 'utf8']).resolves(rawContents);
    },
    missing: ({ path }: { path: string }): void => {
      handle.calledWith([path, 'utf8']).rejects(FsErrorStub({ code: 'ENOENT', path }));
    },
    rejects: ({ path, error }: { path: string; error: unknown }): void => {
      handle.calledWith([path, 'utf8']).rejects(error);
    },
  };
};
