import { closeSync } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';

// A caller closing a descriptor `openForAppendSync` handed back at run time cannot always predict
// the exact number ahead of time, so `calls` also accepts a predicate here — the same widening
// `run.proxy.ts`'s `SpawnArgsMatcher` gives a real call's own unpredictable argument. Read-back only:
// `succeeds`/`throws` still stage by an exact fd.
type FdMatcher = number | ((value: unknown) => boolean);

export const closeSyncProxy = (): {
  succeeds: ({ fd }: { fd: number }) => void;
  throws: ({ fd, error }: { fd: number; error: NodeJS.ErrnoException }) => void;
  calls: ({ fd }: { fd: FdMatcher }) => unknown[][];
} => {
  const handle = registerMock({ fn: closeSync });

  return {
    succeeds: ({ fd }: { fd: number }): void => {
      handle.calledWith([fd]).returns(undefined);
    },
    calls: ({ fd }: { fd: FdMatcher }): unknown[][] => handle.callsMatching([fd]),
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
