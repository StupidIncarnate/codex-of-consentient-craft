import { writeFile } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FsError } from '../../fs/is-fs-error/fs-error';
import type { PathMatcher } from '../../gateway-test-support/path-matcher';

export const writeFileProxy = (): {
  succeeds: ({ path }: { path: string }) => void;
  rejects: ({ path, error }: { path: string; error: FsError }) => void;
  // Fails the NEXT write to this path only; a retry falls through to whatever `succeeds` staged.
  rejectsOnce: ({ path, error }: { path: string; error: FsError }) => void;
  // Lets the NEXT write to this path succeed only. It shares `rejectsOnce`'s queue, consumed in the
  // order staged, so `succeedsOnce` then `rejectsOnce` lets the first write land and fails the second.
  succeedsOnce: ({ path }: { path: string }) => void;
  writtenContentsFor: ({ path }: { path: string }) => unknown;
  getCallsFor: (params: { path: PathMatcher }) => readonly unknown[][];
} => {
  const handle = registerMock({ fn: writeFile });

  return {
    succeeds: ({ path }: { path: string }): void => {
      handle.calledWith([path]).resolves(undefined);
    },
    // `.implement()`, not `.rejects()`: `.rejects()` coerces any value that is not
    // `instanceof Error` through `new Error(String(val))`, which destroys FsErrorStub's
    // prototype-less shape before this wrapper's own error-shape checks ever run.
    // `.implement()` rejects with the staged value untouched.
    rejects: ({ path, error }: { path: string; error: FsError }): void => {
      handle.calledWith([path]).implement(async (): Promise<never> => {
        await Promise.resolve();
        return Promise.reject(error);
      });
    },
    rejectsOnce: ({ path, error }: { path: string; error: FsError }): void => {
      handle.onceFor([path]).implement(async (): Promise<never> => {
        await Promise.resolve();
        return Promise.reject(error);
      });
    },
    succeedsOnce: ({ path }: { path: string }): void => {
      handle.onceFor([path]).resolves(undefined);
    },
    writtenContentsFor: ({ path }: { path: string }): unknown =>
      handle.callsMatching([path]).at(-1)?.[1],
    getCallsFor: ({ path }: { path: PathMatcher }): readonly unknown[][] =>
      handle.callsMatching([path]),
  };
};
