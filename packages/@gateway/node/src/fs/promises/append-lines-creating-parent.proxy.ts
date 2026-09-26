import { mkdir, appendFile } from 'fs/promises';
import { dirname } from 'path';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FsError } from '../is-fs-error';

export const appendLinesCreatingParentProxy = (): {
  succeeds: ({ path }: { path: string }) => void;
  mkdirRejects: ({ path, error }: { path: string; error: FsError }) => void;
  appendRejects: ({ path, error }: { path: string; error: FsError }) => void;
  appendedContentsFor: ({ path }: { path: string }) => unknown;
  mkdirCallsFor: ({ path }: { path: string }) => unknown;
} => {
  const mkdirHandle = registerMock({ fn: mkdir });
  const appendHandle = registerMock({ fn: appendFile });

  return {
    succeeds: ({ path }: { path: string }): void => {
      mkdirHandle.calledWith([dirname(path)]).resolves(undefined);
      appendHandle.calledWith([path]).resolves(undefined);
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
    appendRejects: ({ path, error }: { path: string; error: FsError }): void => {
      mkdirHandle.calledWith([dirname(path)]).resolves(undefined);
      appendHandle.calledWith([path]).implement(async (): Promise<never> => {
        await Promise.resolve();
        return Promise.reject(error);
      });
    },
    appendedContentsFor: ({ path }: { path: string }): unknown =>
      appendHandle.callsMatching([path]).at(-1)?.[1],
    mkdirCallsFor: ({ path }: { path: string }): unknown =>
      mkdirHandle.callsMatching([dirname(path)]),
  };
};
