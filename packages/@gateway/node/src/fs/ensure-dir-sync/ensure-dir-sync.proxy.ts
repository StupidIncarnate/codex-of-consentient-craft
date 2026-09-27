import { mkdirSync } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const ensureDirSyncProxy = (): {
  succeeds: ({ path }: { path: string }) => void;
  throws: ({ path, error }: { path: string; error: NodeJS.ErrnoException }) => void;
  calls: ({ path }: { path: string }) => unknown[][];
} => {
  const handle = registerMock({ fn: mkdirSync });
  handle.calledWith([]).returns(undefined);

  return {
    succeeds: ({ path }: { path: string }): void => {
      handle.calledWith([path, { recursive: true }]).returns(undefined);
    },
    calls: ({ path }: { path: string }): unknown[][] =>
      handle.callsMatching([path, { recursive: true }]),
    // `.implement()`, not `.throws()` — see read-file-sync.proxy.ts for why: `.throws()`
    // coerces a non-`instanceof Error` value through `new Error(String(val))`, destroying
    // FsErrorStub's prototype-less `code`/`path`/`syscall` shape.
    throws: ({ path, error }: { path: string; error: NodeJS.ErrnoException }): void => {
      handle.calledWith([path, { recursive: true }]).implement((): never => {
        throw error;
      });
    },
  };
};
