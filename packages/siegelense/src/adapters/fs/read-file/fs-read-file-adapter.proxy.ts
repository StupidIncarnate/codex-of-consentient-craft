import { readFile } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

export const fsReadFileAdapterProxy = (): {
  resolves: (params: { filePath: AbsoluteFilePath; content: string }) => void;
  rejects: (params: { filePath: AbsoluteFilePath; error: Error }) => void;
} => {
  const mock: MockHandle = registerMock({ fn: readFile });

  return {
    resolves: ({ filePath, content }: { filePath: AbsoluteFilePath; content: string }): void => {
      mock.calledWith([filePath]).resolves(content);
    },

    rejects: ({ filePath, error }: { filePath: AbsoluteFilePath; error: Error }): void => {
      mock.calledWith([filePath]).rejects(error);
    },
  };
};
