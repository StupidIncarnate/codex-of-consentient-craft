import { appendFile } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FsError } from '../../fs/is-fs-error/fs-error';
import type { PathMatcher } from '../../gateway-test-support/path-matcher';

export const appendFileProxy = (): {
  succeeds: ({ path }: { path: string }) => void;
  rejects: ({ path, error }: { path: string; error: FsError }) => void;
  succeedsMatchingPath: ({ path }: { path: PathMatcher }) => void;
  appendedContentsFor: ({ path }: { path: string }) => unknown;
  // Every call's own contents, for calls whose path matches, in call order — `appendedContentsFor`
  // only ever answers the LAST one, which is not enough for a caller that appends several chunks to
  // the same path and needs to prove each one landed.
  getCallsFor: (params: { path: PathMatcher }) => readonly unknown[][];
} => {
  const handle = registerMock({ fn: appendFile });
  const exactPaths: unknown[] = [];

  return {
    succeeds: ({ path }: { path: string }): void => {
      exactPaths.push(path);
      handle.calledWith([path]).resolves(undefined);
    },
    // `.implement()`, not `.rejects()`: `.rejects()` coerces any value that is not
    // `instanceof Error` through `new Error(String(val))`, which destroys FsErrorStub's
    // prototype-less shape. `.implement()` rejects with the staged value untouched.
    rejects: ({ path, error }: { path: string; error: FsError }): void => {
      exactPaths.push(path);
      handle.calledWith([path]).implement(async (): Promise<never> => {
        await Promise.resolve();
        return Promise.reject(error);
      });
    },
    // For a file the test cannot address exactly. The predicate must describe a real structural fact
    // of the address; an accept-all predicate is a banned catch-all default. A predicate and an
    // exact string tie on specificity and the later staging wins, so the predicate is wrapped to
    // step aside for every path this proxy holds an exact stage for, whichever was staged first.
    succeedsMatchingPath: ({ path }: { path: PathMatcher }): void => {
      handle
        .calledWith([
          (value: unknown) =>
            !exactPaths.includes(value) &&
            (typeof path === 'function' ? path(value) : path === value),
        ])
        .resolves(undefined);
    },
    appendedContentsFor: ({ path }: { path: string }): unknown =>
      handle.callsMatching([path]).at(-1)?.[1],
    getCallsFor: ({ path }: { path: PathMatcher }): readonly unknown[][] =>
      handle.callsMatching([path]),
  };
};
