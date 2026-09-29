import { cp, rm } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FsError } from '../../fs/is-fs-error/fs-error';

export const copyDirContentsEntriesRecurseProxy = (): {
  copies: ({ from, entries }: { from: string; entries: readonly string[] }) => void;
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
  cpCallsFor: ({ source }: { source: string }) => unknown;
  rmCallsFor: ({ path }: { path: string }) => unknown;
  getCallsFor: ({ seam, path }: { seam: 'cp' | 'rm'; path: string }) => readonly unknown[][];
} => {
  const cpHandle = registerMock({ fn: cp });
  const rmHandle = registerMock({ fn: rm });

  return {
    copies: ({ from, entries }: { from: string; entries: readonly string[] }): void => {
      for (const entry of entries) {
        cpHandle.calledWith([`${from}/${entry}`]).resolves(undefined);
      }
    },
    // `.implement()`, not `.rejects()`: `.rejects()` coerces any value that is not
    // `instanceof Error` through `new Error(String(val))`, which destroys FsErrorStub's
    // prototype-less shape. `.implement()` rejects with the staged value untouched.
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
      cpHandle.calledWith([`${from}/${entries[0]}`]).resolves(undefined);
      cpHandle.calledWith([`${from}/${entries[1]}`]).implement(async (): Promise<never> => {
        await Promise.resolve();
        return Promise.reject(error);
      });
      rmHandle.calledWith([`${to}/${entries[0]}`]).resolves(undefined);
    },
    cpCallsFor: ({ source }: { source: string }): unknown => cpHandle.callsMatching([source]),
    rmCallsFor: ({ path }: { path: string }): unknown => rmHandle.callsMatching([path]),
    getCallsFor: ({ seam, path }): readonly unknown[][] =>
      seam === 'cp' ? cpHandle.callsMatching([path]) : rmHandle.callsMatching([path]),
  };
};
