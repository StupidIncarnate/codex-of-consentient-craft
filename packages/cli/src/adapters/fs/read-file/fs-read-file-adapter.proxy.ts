import { readFile } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export const fsReadFileAdapterProxy = (): {
  resolves: (params: { filePath: FilePath; content: string }) => void;
  rejects: (params: { filePath: FilePath; error: Error }) => void;
} => {
  const handle = registerMock({ fn: readFile });

  return {
    resolves: ({ filePath, content }: { filePath: FilePath; content: string }): void => {
      handle.calledWith([filePath]).resolves(content);
    },

    rejects: ({ filePath, error }: { filePath: FilePath; error: Error }): void => {
      handle.calledWith([filePath]).rejects(error);
    },
  };
};
