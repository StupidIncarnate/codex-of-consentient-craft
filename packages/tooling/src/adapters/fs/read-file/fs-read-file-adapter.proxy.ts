import { readFile } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { SourceCode } from '../../../contracts/source-code/source-code-contract';

export const fsReadFileAdapterProxy = (): {
  returns: (params: { filePath: AbsoluteFilePath; sourceCode: SourceCode }) => void;
  throws: (params: { filePath: AbsoluteFilePath; error: Error }) => void;
} => {
  const mock = registerMock({ fn: readFile });

  mock.mockImplementation(async () => Promise.resolve(''));

  return {
    returns: ({ sourceCode }: { filePath: AbsoluteFilePath; sourceCode: SourceCode }): void => {
      mock.mockResolvedValueOnce(sourceCode as unknown as Buffer);
    },

    throws: ({ error }: { filePath: AbsoluteFilePath; error: Error }): void => {
      mock.mockRejectedValueOnce(error);
    },
  };
};
