import { readFile } from 'fs/promises';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { SourceCode } from '../../../contracts/source-code/source-code-contract';

jest.mock('fs/promises');

export const fsReadFileAdapterProxy = (): {
  returns: (params: { filePath: AbsoluteFilePath; sourceCode: SourceCode }) => void;
  throws: (params: { filePath: AbsoluteFilePath; error: Error }) => void;
} => {
  const mock = jest.mocked(readFile);

  mock.mockImplementation(async () => '');

  return {
    returns: ({ sourceCode }: { filePath: AbsoluteFilePath; sourceCode: SourceCode }): void => {
      mock.mockResolvedValueOnce(sourceCode as unknown as Buffer);
    },

    throws: ({ error }: { filePath: AbsoluteFilePath; error: Error }): void => {
      mock.mockRejectedValueOnce(error);
    },
  };
};
