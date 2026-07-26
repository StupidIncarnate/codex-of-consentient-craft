import { readFile } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export const fsReadFileAdapterProxy = (): {
  returns: (params: { filePath: FilePath; content: string }) => void;
  throws: (params: { filePath: FilePath; error: Error }) => void;
} => {
  const mock = registerMock({ fn: readFile });

  return {
    returns: ({ filePath, content }: { filePath: FilePath; content: string }): void => {
      mock.calledWith([filePath]).resolves(content as never);
    },
    throws: ({ filePath, error }: { filePath: FilePath; error: Error }): void => {
      mock.calledWith([filePath]).rejects(error);
    },
  };
};
