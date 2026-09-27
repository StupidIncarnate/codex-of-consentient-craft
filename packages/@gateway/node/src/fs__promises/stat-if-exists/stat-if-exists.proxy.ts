import { stat } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { FsErrorStub } from '../../fs/is-fs-error/fs-error.stub';
import { StatsStub } from '../../fs/stats/stats.stub';

export const statIfExistsProxy = (): {
  returnsFile: (params: { path: string; sizeBytes: number; modifiedAtMs: number }) => void;
  missing: (params: { path: string }) => void;
  denied: (params: { path: string }) => void;
} => {
  const handle = registerMock({ fn: stat });

  return {
    returnsFile: ({
      path,
      sizeBytes,
      modifiedAtMs,
    }: {
      path: string;
      sizeBytes: number;
      modifiedAtMs: number;
    }): void => {
      handle.calledWith([path]).resolves(StatsStub({ kind: 'file', sizeBytes, modifiedAtMs }));
    },
    missing: ({ path }: { path: string }): void => {
      handle.calledWith([path]).rejects(FsErrorStub({ code: 'ENOENT', path }));
    },
    denied: ({ path }: { path: string }): void => {
      handle.calledWith([path]).rejects(FsErrorStub({ code: 'EACCES', path }));
    },
  };
};
