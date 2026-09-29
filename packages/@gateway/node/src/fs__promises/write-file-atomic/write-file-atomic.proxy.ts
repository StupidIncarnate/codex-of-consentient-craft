import { mkdir, rename, unlink, writeFile } from 'fs/promises';
import { dirname } from 'path';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FsError } from '../../fs/is-fs-error/fs-error';

export const writeFileAtomicProxy = (): {
  succeeds: ({ path }: { path: string }) => void;
  mkdirRejects: ({ path, error }: { path: string; error: FsError }) => void;
  writeRejects: ({ path, error }: { path: string; error: FsError }) => void;
  renameRejects: ({ path, error }: { path: string; error: FsError }) => void;
  renameRejectsThenUnlinkRejects: ({
    path,
    renameError,
    unlinkError,
  }: {
    path: string;
    renameError: FsError;
    unlinkError: FsError;
  }) => void;
  unlinkCallsForTmp: ({ path }: { path: string }) => unknown;
  getCallsFor: ({
    seam,
    path,
  }: {
    seam: 'mkdir' | 'writeFile' | 'rename' | 'unlink';
    path: string;
  }) => readonly unknown[][];
} => {
  const mkdirHandle = registerMock({ fn: mkdir });
  const writeHandle = registerMock({ fn: writeFile });
  const renameHandle = registerMock({ fn: rename });
  const unlinkHandle = registerMock({ fn: unlink });

  return {
    succeeds: ({ path }: { path: string }): void => {
      mkdirHandle.calledWith([dirname(path)]).resolves(undefined);
      writeHandle.calledWith([`${path}.tmp`]).resolves(undefined);
      renameHandle.calledWith([`${path}.tmp`, path]).resolves(undefined);
    },
    // `.implement()`, not `.rejects()`, everywhere below: `.rejects()` coerces any value that is
    // not `instanceof Error` through `new Error(String(val))`, which destroys FsErrorStub's
    // prototype-less shape. `.implement()` rejects with the staged value untouched.
    mkdirRejects: ({ path, error }: { path: string; error: FsError }): void => {
      mkdirHandle.calledWith([dirname(path)]).implement(async (): Promise<never> => {
        await Promise.resolve();
        return Promise.reject(error);
      });
    },
    writeRejects: ({ path, error }: { path: string; error: FsError }): void => {
      mkdirHandle.calledWith([dirname(path)]).resolves(undefined);
      writeHandle.calledWith([`${path}.tmp`]).implement(async (): Promise<never> => {
        await Promise.resolve();
        return Promise.reject(error);
      });
    },
    renameRejects: ({ path, error }: { path: string; error: FsError }): void => {
      mkdirHandle.calledWith([dirname(path)]).resolves(undefined);
      writeHandle.calledWith([`${path}.tmp`]).resolves(undefined);
      renameHandle.calledWith([`${path}.tmp`, path]).implement(async (): Promise<never> => {
        await Promise.resolve();
        return Promise.reject(error);
      });
      unlinkHandle.calledWith([`${path}.tmp`]).resolves(undefined);
    },
    renameRejectsThenUnlinkRejects: ({
      path,
      renameError,
      unlinkError,
    }: {
      path: string;
      renameError: FsError;
      unlinkError: FsError;
    }): void => {
      mkdirHandle.calledWith([dirname(path)]).resolves(undefined);
      writeHandle.calledWith([`${path}.tmp`]).resolves(undefined);
      renameHandle.calledWith([`${path}.tmp`, path]).implement(async (): Promise<never> => {
        await Promise.resolve();
        return Promise.reject(renameError);
      });
      unlinkHandle.calledWith([`${path}.tmp`]).implement(async (): Promise<never> => {
        await Promise.resolve();
        return Promise.reject(unlinkError);
      });
    },
    unlinkCallsForTmp: ({ path }: { path: string }): unknown =>
      unlinkHandle.callsMatching([`${path}.tmp`]),
    // `path` is the target path the wrapper was given; each seam is addressed by the argument the
    // wrapper passes it (mkdir: the dirname, writeFile/rename/unlink: the `.tmp` sibling).
    getCallsFor: ({ seam, path }): readonly unknown[][] => {
      if (seam === 'mkdir') {
        return mkdirHandle.callsMatching([dirname(path)]);
      }
      if (seam === 'writeFile') {
        return writeHandle.callsMatching([`${path}.tmp`]);
      }
      if (seam === 'rename') {
        return renameHandle.callsMatching([`${path}.tmp`, path]);
      }
      return unlinkHandle.callsMatching([`${path}.tmp`]);
    },
  };
};
