import { writeFileSync } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { PathMatcher } from '../../gateway-test-support/path-matcher';

export const writeFileBytesSyncProxy = (): {
  succeeds: ({ path }: { path: string }) => void;
  throws: ({ path, error }: { path: string; error: NodeJS.ErrnoException }) => void;
  writtenBytesFor: ({ path }: { path: string }) => unknown;
  getCallsFor: (params: { path: PathMatcher }) => readonly unknown[][];
} => {
  const handle = registerMock({ fn: writeFileSync });

  return {
    // Addressed by path alone: the bytes vary per test, so they cannot be part of the address.
    succeeds: ({ path }: { path: string }): void => {
      handle.calledWith([path]).returns(undefined);
    },
    // `.implement()`, not `.throws()` — see read-file-sync.proxy.ts for why: `.throws()`
    // coerces a non-`instanceof Error` value through `new Error(String(val))`, destroying
    // FsErrorStub's prototype-less `code`/`path`/`syscall` shape.
    throws: ({ path, error }: { path: string; error: NodeJS.ErrnoException }): void => {
      handle.calledWith([path]).implement((): never => {
        throw error;
      });
    },
    writtenBytesFor: ({ path }: { path: string }): unknown =>
      handle.callsMatching([path]).at(-1)?.[1],
    getCallsFor: ({ path }: { path: PathMatcher }): readonly unknown[][] =>
      handle.callsMatching([path]),
  };
};
