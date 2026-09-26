import { openSync } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const openForAppendSyncProxy = (): {
  returns: ({ path, fd }: { path: string; fd: number }) => void;
  throws: ({ path, error }: { path: string; error: NodeJS.ErrnoException }) => void;
} => {
  const handle = registerMock({ fn: openSync });

  return {
    returns: ({ path, fd }: { path: string; fd: number }): void => {
      handle.calledWith([path, 'a']).returns(fd);
    },
    // `.implement()`, not `.throws()` — see read-file-sync.proxy.ts for why: `.throws()`
    // coerces a non-`instanceof Error` value through `new Error(String(val))`, destroying
    // FsErrorStub's prototype-less `code`/`path`/`syscall` shape.
    throws: ({ path, error }: { path: string; error: NodeJS.ErrnoException }): void => {
      handle.calledWith([path, 'a']).implement((): never => {
        throw error;
      });
    },
  };
};
