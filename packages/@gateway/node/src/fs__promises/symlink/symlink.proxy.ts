import { symlink } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FsError } from '../../fs/is-fs-error/fs-error';
import type { PathMatcher } from '../../gateway-test-support/path-matcher';

export const symlinkProxy = (): {
  succeeds: ({ target, path }: { target: string; path: string }) => void;
  rejects: ({ target, path, error }: { target: string; path: string; error: FsError }) => void;
  getCallsFor: (params: { target: PathMatcher; path: PathMatcher }) => readonly unknown[][];
} => {
  const handle = registerMock({ fn: symlink });

  return {
    succeeds: ({ target, path }: { target: string; path: string }): void => {
      handle.calledWith([target, path]).resolves(undefined);
    },
    // `.implement()`, not `.rejects()`: `.rejects()` coerces any value that is not
    // `instanceof Error` through `new Error(String(val))`, which destroys FsErrorStub's
    // prototype-less shape. `.implement()` rejects with the staged value untouched.
    rejects: ({ target, path, error }: { target: string; path: string; error: FsError }): void => {
      handle.calledWith([target, path]).implement(async (): Promise<never> => {
        await Promise.resolve();
        return Promise.reject(error);
      });
    },
    getCallsFor: ({
      target,
      path,
    }: {
      target: PathMatcher;
      path: PathMatcher;
    }): readonly unknown[][] => handle.callsMatching([target, path]),
  };
};
