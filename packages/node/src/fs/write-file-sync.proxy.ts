import { writeFileSync } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const writeFileSyncProxy = (): {
  succeeds: ({ path }: { path: string }) => void;
  throws: ({ path, error }: { path: string; error: NodeJS.ErrnoException }) => void;
  writtenContents: ({ path }: { path: string }) => unknown;
} => {
  const handle = registerMock({ fn: writeFileSync });
  handle.calledWith([]).returns(undefined);

  return {
    // Addressed by path alone: the real call is `nodeWriteFileSync(path, contents, 'utf8')`,
    // and contents varies per test, so it cannot be part of the match address.
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
    writtenContents: ({ path }: { path: string }): unknown =>
      handle.callsMatching([path]).at(-1)?.[1],
  };
};
