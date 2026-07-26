import { readFile } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { SourceCode } from '../../../contracts/source-code/source-code-contract';

export const fsReadFileAdapterProxy = (): {
  returns: (params: { filePath: AbsoluteFilePath; sourceCode: SourceCode }) => void;
  throws: (params: { filePath: AbsoluteFilePath; error: Error }) => void;
} => {
  const mock = registerMock({ fn: readFile });

  return {
    returns: ({
      filePath,
      sourceCode,
    }: {
      filePath: AbsoluteFilePath;
      sourceCode: SourceCode;
    }): void => {
      mock.calledWith([filePath]).resolves(sourceCode);
    },

    throws: ({ filePath, error }: { filePath: AbsoluteFilePath; error: Error }): void => {
      mock.calledWith([filePath]).rejects(error);
    },
  };
};
