import { closeSync } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const closeSyncProxy = (): {
  succeeds: ({ fd }: { fd: number }) => void;
  throws: ({ fd, error }: { fd: number; error: NodeJS.ErrnoException }) => void;
  calls: ({ fd }: { fd: number }) => unknown[][];
} => {
  const handle = registerMock({ fn: closeSync });

  return {
    succeeds: ({ fd }: { fd: number }): void => {
      handle.calledWith([fd]).returns(undefined);
    },
    calls: ({ fd }: { fd: number }): unknown[][] => handle.callsMatching([fd]),
    // `.implement()`, not `.throws()` — see read-file-sync.proxy.ts for why: `.throws()`
    // coerces a non-`instanceof Error` value through `new Error(String(val))`, destroying
    // FsErrorStub's prototype-less `code`/`path`/`syscall` shape.
    throws: ({ fd, error }: { fd: number; error: NodeJS.ErrnoException }): void => {
      handle.calledWith([fd]).implement((): never => {
        throw error;
      });
    },
  };
};
