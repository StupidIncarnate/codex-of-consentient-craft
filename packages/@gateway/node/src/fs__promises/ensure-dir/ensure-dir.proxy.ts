import { mkdir } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FsError } from '../../fs/is-fs-error/fs-error';
import type { PathMatcher } from '../../gateway-test-support/path-matcher';

export const ensureDirProxy = (): {
  succeeds: ({ path }: { path: string }) => void;
  rejects: ({ path, error }: { path: string; error: FsError }) => void;
  succeedsMatchingPath: ({ path }: { path: PathMatcher }) => void;
  getCallsFor: (params: { path: PathMatcher }) => readonly unknown[][];
} => {
  const handle = registerMock({ fn: mkdir });

  return {
    succeeds: ({ path }: { path: string }): void => {
      handle.calledWith([path]).resolves(undefined);
    },
    // `.implement()`, not `.rejects()`: `.rejects()` coerces any value that is not
    // `instanceof Error` through `new Error(String(val))`, which destroys FsErrorStub's
    // prototype-less shape. `.implement()` rejects with the staged value untouched.
    rejects: ({ path, error }: { path: string; error: FsError }): void => {
      handle.calledWith([path]).implement(async (): Promise<never> => {
        await Promise.resolve();
        return Promise.reject(error);
      });
    },
    // For a directory the test cannot know exactly. The predicate must describe a real structural
    // fact of the address; an accept-all predicate is a banned catch-all default.
    succeedsMatchingPath: ({ path }: { path: PathMatcher }): void => {
      handle.calledWith([path]).resolves(undefined);
    },
    getCallsFor: ({ path }: { path: PathMatcher }): readonly unknown[][] =>
      handle.callsMatching([path]),
  };
};
