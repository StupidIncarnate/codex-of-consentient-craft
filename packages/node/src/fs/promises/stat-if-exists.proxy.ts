import { stat } from 'fs/promises';
import type { Stats } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { FsErrorStub } from '../fs-error.stub';

export const statIfExistsProxy = (): {
  returnsFile: (params: { path: string; sizeBytes: number; modifiedAtMs: number }) => void;
  missing: (params: { path: string }) => void;
  rejects: (params: { path: string; error: unknown }) => void;
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
      handle.calledWith([path]).resolves({
        size: sizeBytes,
        mtimeMs: modifiedAtMs,
        isFile: (): boolean => true,
        isDirectory: (): boolean => false,
        isSymbolicLink: (): boolean => false,
      } as unknown as Stats);
    },
    missing: ({ path }: { path: string }): void => {
      handle.calledWith([path]).rejects(FsErrorStub({ code: 'ENOENT', path }));
    },
    rejects: ({ path, error }: { path: string; error: unknown }): void => {
      handle.calledWith([path]).rejects(error);
    },
  };
};
