import { copyFile } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FsError } from '../is-fs-error';

export const copyFileProxy = (): {
  succeeds: ({ from, to }: { from: string; to: string }) => void;
  rejects: ({ from, to, error }: { from: string; to: string; error: FsError }) => void;
} => {
  const handle = registerMock({ fn: copyFile });

  return {
    succeeds: ({ from, to }: { from: string; to: string }): void => {
      handle.calledWith([from, to]).resolves(undefined);
    },
    // `.implement()`, not `.rejects()`: `.rejects()` coerces any value that is not
    // `instanceof Error` through `new Error(String(val))`, which destroys FsErrorStub's
    // prototype-less shape. `.implement()` rejects with the staged value untouched.
    rejects: ({ from, to, error }: { from: string; to: string; error: FsError }): void => {
      handle.calledWith([from, to]).implement(async (): Promise<never> => {
        await Promise.resolve();
        return Promise.reject(error);
      });
    },
  };
};
