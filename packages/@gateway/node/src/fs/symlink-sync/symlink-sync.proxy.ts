import { symlinkSync } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const symlinkSyncProxy = (): {
  succeeds: ({ target, path }: { target: string; path: string }) => void;
  throws: ({
    target,
    path,
    error,
  }: {
    target: string;
    path: string;
    error: NodeJS.ErrnoException;
  }) => void;
  calls: ({ target, path }: { target: string; path: string }) => unknown[][];
} => {
  const handle = registerMock({ fn: symlinkSync });

  return {
    succeeds: ({ target, path }: { target: string; path: string }): void => {
      handle.calledWith([target, path]).returns(undefined);
    },
    calls: ({ target, path }: { target: string; path: string }): unknown[][] =>
      handle.callsMatching([target, path]),
    // `.implement()`, not `.throws()` — see read-file-sync.proxy.ts for why: `.throws()`
    // coerces a non-`instanceof Error` value through `new Error(String(val))`, destroying
    // FsErrorStub's prototype-less `code`/`path`/`syscall` shape.
    throws: ({
      target,
      path,
      error,
    }: {
      target: string;
      path: string;
      error: NodeJS.ErrnoException;
    }): void => {
      handle.calledWith([target, path]).implement((): never => {
        throw error;
      });
    },
  };
};
