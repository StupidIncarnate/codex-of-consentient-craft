import { mkdir, writeFile } from 'fs/promises';
import { dirname } from 'path';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FsError } from '../../fs/is-fs-error/fs-error';
import type { PathMatcher } from '../../gateway-test-support/path-matcher';

export const writeFileCreatingParentProxy = (): {
  succeeds: ({ path }: { path: string }) => void;
  mkdirRejects: ({ path, error }: { path: string; error: FsError }) => void;
  writeRejects: ({ path, error }: { path: string; error: FsError }) => void;
  writtenContentsFor: ({ path }: { path: string }) => unknown;
  getCallsFor: (params: { path: PathMatcher }) => readonly unknown[][];
  // Keys on `dirname(path)`, so `path` here is the real file path, not a predicate over the
  // computed mkdir target.
  mkdirCallsFor: (params: { path: string }) => readonly unknown[][];
} => {
  const mkdirHandle = registerMock({ fn: mkdir });
  const writeHandle = registerMock({ fn: writeFile });

  return {
    succeeds: ({ path }: { path: string }): void => {
      mkdirHandle.calledWith([dirname(path)]).resolves(undefined);
      writeHandle.calledWith([path]).resolves(undefined);
    },
    // `.implement()`, not `.rejects()`: `.rejects()` coerces any value that is not
    // `instanceof Error` through `new Error(String(val))`, which destroys FsErrorStub's
    // prototype-less shape. `.implement()` rejects with the staged value untouched.
    mkdirRejects: ({ path, error }: { path: string; error: FsError }): void => {
      mkdirHandle.calledWith([dirname(path)]).implement(async (): Promise<never> => {
        await Promise.resolve();
        return Promise.reject(error);
      });
    },
    writeRejects: ({ path, error }: { path: string; error: FsError }): void => {
      mkdirHandle.calledWith([dirname(path)]).resolves(undefined);
      writeHandle.calledWith([path]).implement(async (): Promise<never> => {
        await Promise.resolve();
        return Promise.reject(error);
      });
    },
    writtenContentsFor: ({ path }: { path: string }): unknown =>
      writeHandle.callsMatching([path]).at(-1)?.[1],
    getCallsFor: ({ path }: { path: PathMatcher }): readonly unknown[][] =>
      writeHandle.callsMatching([path]),
    mkdirCallsFor: ({ path }: { path: string }): readonly unknown[][] =>
      mkdirHandle.callsMatching([dirname(path)]),
  };
};
