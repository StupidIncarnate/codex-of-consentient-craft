import { realpath } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export const fsRealpathAdapterProxy = (): {
  resolves: (params: { filePath: FilePath; resolvedPath: string }) => void;
  rejects: (params: { filePath: FilePath; error: Error }) => void;
} => {
  const mock: MockHandle = registerMock({ fn: realpath });

  return {
    resolves: ({ filePath, resolvedPath }: { filePath: FilePath; resolvedPath: string }): void => {
      mock.calledWith([filePath]).resolves(resolvedPath);
    },

    rejects: ({ filePath, error }: { filePath: FilePath; error: Error }): void => {
      mock.calledWith([filePath]).rejects(error);
    },
  };
};
