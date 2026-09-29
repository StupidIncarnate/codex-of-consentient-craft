import { mkdtempSync } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const mkdtempSyncProxy = (): {
  returns: ({ prefix, dir }: { prefix: string; dir: string }) => void;
  throws: ({ prefix, error }: { prefix: string; error: NodeJS.ErrnoException }) => void;
  getCallsFor: ({ prefix }: { prefix: string }) => readonly unknown[][];
} => {
  const handle = registerMock({ fn: mkdtempSync });

  return {
    returns: ({ prefix, dir }: { prefix: string; dir: string }): void => {
      handle.calledWith([prefix]).returns(dir);
    },
    // `.implement()`, not `.throws()` — see read-file-sync.proxy.ts for why: `.throws()`
    // coerces a non-`instanceof Error` value through `new Error(String(val))`, destroying
    // FsErrorStub's prototype-less `code`/`path`/`syscall` shape.
    throws: ({ prefix, error }: { prefix: string; error: NodeJS.ErrnoException }): void => {
      handle.calledWith([prefix]).implement((): never => {
        throw error;
      });
    },
    getCallsFor: ({ prefix }: { prefix: string }): readonly unknown[][] =>
      handle.callsMatching([prefix]),
  };
};
