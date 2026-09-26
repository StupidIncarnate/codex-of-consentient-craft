import { cp, readdir, rm } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FsError } from '../is-fs-error';

export const copyDirContentsProxy = (): {
  succeeds: ({ from, entries }: { from: string; entries: readonly string[] }) => void;
  readdirRejects: ({ from, error }: { from: string; error: FsError }) => void;
  secondEntryFails: ({
    from,
    to,
    entries,
    error,
  }: {
    from: string;
    to: string;
    entries: readonly [string, string];
    error: FsError;
  }) => void;
  rmCallsFor: ({ path }: { path: string }) => unknown;
} => {
  const readdirHandle = registerMock({ fn: readdir });
  const cpHandle = registerMock({ fn: cp });
  const rmHandle = registerMock({ fn: rm });

  return {
    succeeds: ({ from, entries }: { from: string; entries: readonly string[] }): void => {
      readdirHandle.calledWith([from]).resolves([...entries]);
      for (const entry of entries) {
        cpHandle.calledWith([`${from}/${entry}`]).resolves(undefined);
      }
    },
    // `.implement()`, not `.rejects()`: `.rejects()` coerces any value that is not
    // `instanceof Error` through `new Error(String(val))`, which destroys FsErrorStub's
    // prototype-less shape. `.implement()` rejects with the staged value untouched.
    readdirRejects: ({ from, error }: { from: string; error: FsError }): void => {
      readdirHandle.calledWith([from]).implement(async (): Promise<never> => {
        await Promise.resolve();
        return Promise.reject(error);
      });
    },
    secondEntryFails: ({
      from,
      to,
      entries,
      error,
    }: {
      from: string;
      to: string;
      entries: readonly [string, string];
      error: FsError;
    }): void => {
      readdirHandle.calledWith([from]).resolves([...entries]);
      cpHandle.calledWith([`${from}/${entries[0]}`]).resolves(undefined);
      cpHandle.calledWith([`${from}/${entries[1]}`]).implement(async (): Promise<never> => {
        await Promise.resolve();
        return Promise.reject(error);
      });
      rmHandle.calledWith([`${to}/${entries[0]}`]).resolves(undefined);
    },
    rmCallsFor: ({ path }: { path: string }): unknown => rmHandle.callsMatching([path]),
  };
};
