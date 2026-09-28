import { rm } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FsError } from '../../fs/is-fs-error/fs-error';
import type { PathMatcher } from '../../gateway-test-support/path-matcher';

export const rmProxy = (): {
  succeeds: ({ path }: { path: string }) => void;
  rejects: ({ path, error }: { path: string; error: FsError }) => void;
  succeedsMatchingPath: ({ path }: { path: PathMatcher }) => void;
  rejectsMatchingPath: ({ path, error }: { path: PathMatcher; error: FsError }) => void;
  // Every call's FULL argument tuple — path and the options object `rm` passed, exactly as
  // received (`[path, {recursive, force}]`) — for calls whose path matches, in call order.
  getCallsFor: (params: { path: PathMatcher }) => readonly unknown[][];
} => {
  const handle = registerMock({ fn: rm });

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
    // For a path the test cannot know exactly (minted from ids the proxy never receives). The
    // predicate must describe a real structural fact of the address; an accept-all predicate is a
    // catch-all default and is banned.
    succeedsMatchingPath: ({ path }: { path: PathMatcher }): void => {
      handle.calledWith([path]).resolves(undefined);
    },
    rejectsMatchingPath: ({ path, error }: { path: PathMatcher; error: FsError }): void => {
      handle.calledWith([path]).implement(async (): Promise<never> => {
        await Promise.resolve();
        return Promise.reject(error);
      });
    },
    getCallsFor: ({ path }: { path: PathMatcher }): readonly unknown[][] =>
      handle.callsMatching([path]),
  };
};
