import { stat } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { FsErrorStub } from '../../fs/is-fs-error/fs-error.stub';
import type { FsError } from '../../fs/is-fs-error/fs-error';
import { StatsStub } from '../../fs/stats/stats.stub';
import type { PathMatcher } from '../../gateway-test-support/path-matcher';

type StatKind = 'file' | 'directory' | 'symlink' | 'other';

export const statProxy = (): {
  returnsFile: (params: {
    path: string;
    sizeBytes: number;
    modifiedAtMs: number;
    createdAtMs?: number;
  }) => void;
  returnsDirectory: (params: {
    path: string;
    sizeBytes: number;
    modifiedAtMs: number;
    createdAtMs?: number;
  }) => void;
  returnsSymlink: (params: {
    path: string;
    sizeBytes: number;
    modifiedAtMs: number;
    createdAtMs?: number;
  }) => void;
  missing: (params: { path: string }) => void;
  denied: (params: { path: string }) => void;
  returnsMatchingPath: (params: {
    path: PathMatcher;
    kind: StatKind;
    sizeBytes: number;
    modifiedAtMs: number;
    createdAtMs?: number;
  }) => void;
  throwsMatchingPath: (params: { path: PathMatcher; error: FsError }) => void;
  getCallsFor: (params: { path: PathMatcher }) => readonly unknown[][];
} => {
  const handle = registerMock({ fn: stat });

  return {
    returnsFile: ({
      path,
      sizeBytes,
      modifiedAtMs,
      createdAtMs,
    }: {
      path: string;
      sizeBytes: number;
      modifiedAtMs: number;
      createdAtMs?: number;
    }): void => {
      handle.calledWith([path]).resolves(
        StatsStub({
          kind: 'file',
          sizeBytes,
          modifiedAtMs,
          ...(createdAtMs === undefined ? {} : { createdAtMs }),
        }),
      );
    },
    returnsDirectory: ({
      path,
      sizeBytes,
      modifiedAtMs,
      createdAtMs,
    }: {
      path: string;
      sizeBytes: number;
      modifiedAtMs: number;
      createdAtMs?: number;
    }): void => {
      handle.calledWith([path]).resolves(
        StatsStub({
          kind: 'directory',
          sizeBytes,
          modifiedAtMs,
          ...(createdAtMs === undefined ? {} : { createdAtMs }),
        }),
      );
    },
    returnsSymlink: ({
      path,
      sizeBytes,
      modifiedAtMs,
      createdAtMs,
    }: {
      path: string;
      sizeBytes: number;
      modifiedAtMs: number;
      createdAtMs?: number;
    }): void => {
      handle.calledWith([path]).resolves(
        StatsStub({
          kind: 'symlink',
          sizeBytes,
          modifiedAtMs,
          ...(createdAtMs === undefined ? {} : { createdAtMs }),
        }),
      );
    },
    missing: ({ path }: { path: string }): void => {
      handle.calledWith([path]).rejects(FsErrorStub({ code: 'ENOENT', path }));
    },
    denied: ({ path }: { path: string }): void => {
      handle.calledWith([path]).rejects(FsErrorStub({ code: 'EACCES', path }));
    },
    returnsMatchingPath: ({
      path,
      kind,
      sizeBytes,
      modifiedAtMs,
      createdAtMs,
    }: {
      path: PathMatcher;
      kind: StatKind;
      sizeBytes: number;
      modifiedAtMs: number;
      createdAtMs?: number;
    }): void => {
      handle.calledWith([path]).resolves(
        StatsStub({
          kind,
          sizeBytes,
          modifiedAtMs,
          ...(createdAtMs === undefined ? {} : { createdAtMs }),
        }),
      );
    },
    throwsMatchingPath: ({ path, error }: { path: PathMatcher; error: FsError }): void => {
      handle.calledWith([path]).rejects(error);
    },
    getCallsFor: ({ path }: { path: PathMatcher }): readonly unknown[][] =>
      handle.callsMatching([path]),
  };
};
