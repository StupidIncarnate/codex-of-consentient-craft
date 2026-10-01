import { mkdirSync, renameSync, unlinkSync, writeFileSync } from 'fs';
import { dirname } from 'path';
import { threadId } from 'worker_threads';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FsError } from '../is-fs-error/fs-error';

export const writeFileAtomicSyncProxy = (): {
  succeeds: ({ path }: { path: string }) => void;
  succeedsMatchingPath: ({ path }: { path: (value: unknown) => boolean }) => void;
  writeThrows: ({ path, error }: { path: string; error: FsError }) => void;
  renameThrows: ({ path, error }: { path: string; error: FsError }) => void;
  renameThrowsThenUnlinkThrows: ({
    path,
    renameError,
    unlinkError,
  }: {
    path: string;
    renameError: FsError;
    unlinkError: FsError;
  }) => void;
  writtenContents: ({ path }: { path: string }) => unknown;
  getCallsFor: ({
    seam,
    path,
  }: {
    seam: 'mkdirSync' | 'writeFileSync' | 'renameSync' | 'unlinkSync';
    path: string;
  }) => readonly unknown[][];
} => {
  const mkdirHandle = registerMock({ fn: mkdirSync });
  const writeHandle = registerMock({ fn: writeFileSync });
  const renameHandle = registerMock({ fn: renameSync });
  const unlinkHandle = registerMock({ fn: unlinkSync });

  const tmpSuffix = `.${String(process.pid)}-${String(threadId)}.tmp`;

  return {
    succeeds: ({ path }: { path: string }): void => {
      mkdirHandle.calledWith([dirname(path)]).returns(undefined);
      writeHandle.calledWith([`${path}${tmpSuffix}`]).returns(undefined);
      renameHandle.calledWith([`${path}${tmpSuffix}`, path]).returns(undefined);
    },
    // One predicate addresses every seam's first argument — the parent folder, the temp sibling and
    // the temp sibling again for the rename — for a caller whose target path the test cannot know
    // (a cache folder under a root derived from a linted file). It must match all three.
    succeedsMatchingPath: ({ path }: { path: (value: unknown) => boolean }): void => {
      mkdirHandle.calledWith([path]).returns(undefined);
      writeHandle.calledWith([path]).returns(undefined);
      renameHandle.calledWith([path]).returns(undefined);
    },
    // `.implement()`, not `.throws()` — `.throws()` coerces a value that is not `instanceof Error`
    // through `new Error(String(val))`, which destroys FsErrorStub's `code`/`path` shape.
    writeThrows: ({ path, error }: { path: string; error: FsError }): void => {
      mkdirHandle.calledWith([dirname(path)]).returns(undefined);
      writeHandle.calledWith([`${path}${tmpSuffix}`]).implement((): never => {
        throw error;
      });
      unlinkHandle.calledWith([`${path}${tmpSuffix}`]).returns(undefined);
    },
    renameThrows: ({ path, error }: { path: string; error: FsError }): void => {
      mkdirHandle.calledWith([dirname(path)]).returns(undefined);
      writeHandle.calledWith([`${path}${tmpSuffix}`]).returns(undefined);
      renameHandle.calledWith([`${path}${tmpSuffix}`, path]).implement((): never => {
        throw error;
      });
      unlinkHandle.calledWith([`${path}${tmpSuffix}`]).returns(undefined);
    },
    renameThrowsThenUnlinkThrows: ({
      path,
      renameError,
      unlinkError,
    }: {
      path: string;
      renameError: FsError;
      unlinkError: FsError;
    }): void => {
      mkdirHandle.calledWith([dirname(path)]).returns(undefined);
      writeHandle.calledWith([`${path}${tmpSuffix}`]).returns(undefined);
      renameHandle.calledWith([`${path}${tmpSuffix}`, path]).implement((): never => {
        throw renameError;
      });
      unlinkHandle.calledWith([`${path}${tmpSuffix}`]).implement((): never => {
        throw unlinkError;
      });
    },
    writtenContents: ({ path }: { path: string }): unknown =>
      writeHandle.callsMatching([`${path}${tmpSuffix}`]).at(-1)?.[1],
    // `path` is the target the wrapper was given; each seam is addressed by the argument the wrapper
    // passes it (mkdirSync: the dirname, writeFileSync/renameSync/unlinkSync: the temp sibling).
    getCallsFor: ({ seam, path }): readonly unknown[][] => {
      if (seam === 'mkdirSync') {
        return mkdirHandle.callsMatching([dirname(path)]);
      }
      if (seam === 'writeFileSync') {
        return writeHandle.callsMatching([`${path}${tmpSuffix}`]);
      }
      if (seam === 'renameSync') {
        return renameHandle.callsMatching([`${path}${tmpSuffix}`, path]);
      }
      return unlinkHandle.callsMatching([`${path}${tmpSuffix}`]);
    },
  };
};
