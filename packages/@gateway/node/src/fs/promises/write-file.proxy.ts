import { writeFile } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FsError } from '../is-fs-error';

export const writeFileProxy = (): {
  succeeds: ({ path }: { path: string }) => void;
  rejects: ({ path, error }: { path: string; error: FsError }) => void;
  writtenContentsFor: ({ path }: { path: string }) => unknown;
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
    writtenContentsFor: ({ path }: { path: string }): unknown =>
      handle.callsMatching([path]).at(-1)?.[1],
  };
};
