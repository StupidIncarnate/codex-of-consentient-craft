import { readFile } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { FsErrorStub } from '../../fs/is-fs-error/fs-error.stub';

export const readJsonFileIfExistsProxy = (): {
  returnsRaw: (params: { path: string; rawContents: string }) => void;
  missing: (params: { path: string }) => void;
  denied: (params: { path: string }) => void;
} => {
  const handle = registerMock({ fn: readFile });

  return {
    returnsRaw: ({ path, rawContents }: { path: string; rawContents: string }): void => {
      handle.calledWith([path, 'utf8']).resolves(rawContents);
    },
    missing: ({ path }: { path: string }): void => {
      handle.calledWith([path, 'utf8']).rejects(FsErrorStub({ code: 'ENOENT', path }));
    },
    // syscall: 'open' — real callers of this proxy (config/hooks/mcp install responders) assert
    // the derived error message text, which names the real Node syscall readFile fails inside.
    denied: ({ path }: { path: string }): void => {
      handle
        .calledWith([path, 'utf8'])
        .rejects(FsErrorStub({ code: 'EACCES', path, syscall: 'open' }));
    },
  };
};
