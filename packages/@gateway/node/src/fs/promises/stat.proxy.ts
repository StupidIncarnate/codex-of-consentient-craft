import { stat } from 'fs/promises';
import type { Stats } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const statProxy = (): {
  returnsFile: (params: { path: string; sizeBytes: number; modifiedAtMs: number }) => void;
  returnsDirectory: (params: { path: string; sizeBytes: number; modifiedAtMs: number }) => void;
  returnsSymlink: (params: { path: string; sizeBytes: number; modifiedAtMs: number }) => void;
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
    returnsDirectory: ({
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
        isFile: (): boolean => false,
        isDirectory: (): boolean => true,
        isSymbolicLink: (): boolean => false,
      } as unknown as Stats);
    },
    returnsSymlink: ({
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
        isFile: (): boolean => false,
        isDirectory: (): boolean => false,
        isSymbolicLink: (): boolean => true,
      } as unknown as Stats);
    },
    rejects: ({ path, error }: { path: string; error: unknown }): void => {
      handle.calledWith([path]).rejects(error);
    },
  };
};
