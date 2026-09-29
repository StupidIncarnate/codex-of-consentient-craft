import { readdir } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FsError } from '../../fs/is-fs-error/fs-error';
import { copyDirContentsEntriesRecurseProxy } from '../copy-dir-contents-entries-recurse/copy-dir-contents-entries-recurse.proxy';

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
  cpCallsFor: ({ source }: { source: string }) => unknown;
  getCallsFor: ({
    seam,
    path,
  }: {
    seam: 'readdir' | 'cp' | 'rm';
    path: string;
  }) => readonly unknown[][];
} => {
  const readdirHandle = registerMock({ fn: readdir });
  const entriesRecurseProxy = copyDirContentsEntriesRecurseProxy();

  return {
    succeeds: ({ from, entries }: { from: string; entries: readonly string[] }): void => {
      readdirHandle.calledWith([from]).resolves([...entries]);
      entriesRecurseProxy.copies({ from, entries });
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
      entriesRecurseProxy.secondEntryFails({ from, to, entries, error });
    },
    rmCallsFor: ({ path }: { path: string }): unknown => entriesRecurseProxy.rmCallsFor({ path }),
    cpCallsFor: ({ source }: { source: string }): unknown =>
      entriesRecurseProxy.cpCallsFor({ source }),
    getCallsFor: ({ seam, path }): readonly unknown[][] =>
      seam === 'readdir'
        ? readdirHandle.callsMatching([path])
        : entriesRecurseProxy.getCallsFor({ seam, path }),
  };
};
