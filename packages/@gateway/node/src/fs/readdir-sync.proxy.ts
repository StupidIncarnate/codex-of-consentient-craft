import { readdirSync } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const readdirSyncProxy = (): {
  returns: ({ path, names }: { path: string; names: string[] }) => void;
  throws: ({ path, error }: { path: string; error: NodeJS.ErrnoException }) => void;
} => {
  const handle = registerMock({ fn: readdirSync });

  return {
    returns: ({ path, names }: { path: string; names: string[] }): void => {
      handle.calledWith([path]).returns(names);
    },
    // `.implement()`, not `.throws()` — see read-file-sync.proxy.ts for why: `.throws()`
    // coerces a non-`instanceof Error` value through `new Error(String(val))`, destroying
    // FsErrorStub's prototype-less `code`/`path`/`syscall` shape.
    throws: ({ path, error }: { path: string; error: NodeJS.ErrnoException }): void => {
      handle.calledWith([path]).implement((): never => {
        throw error;
      });
    },
  };
};
