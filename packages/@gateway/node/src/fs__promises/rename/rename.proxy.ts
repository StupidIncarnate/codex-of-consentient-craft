import { rename } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FsError } from '../../fs/is-fs-error/fs-error';
import type { PathMatcher } from '../../gateway-test-support/path-matcher';

export const renameProxy = (): {
  succeeds: ({ from, to }: { from: string; to: string }) => void;
  rejects: ({ from, to, error }: { from: string; to: string; error: FsError }) => void;
  getCallsFor: (params: { from: PathMatcher; to: PathMatcher }) => readonly unknown[][];
} => {
  const handle = registerMock({ fn: rename });

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
    getCallsFor: ({ from, to }: { from: PathMatcher; to: PathMatcher }): readonly unknown[][] =>
      handle.callsMatching([from, to]),
  };
};
