import { readFile } from 'fs/promises';
import type { FilePath } from '@dungeonmaster/shared/contracts';
import type { FileContentsStub } from '../../../contracts/file-contents/file-contents.stub';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const fsReadFileAdapterProxy = (): {
  returns: (params: { filePath: FilePath; contents: ReturnType<typeof FileContentsStub> }) => void;
  throws: (params: { filePath: FilePath; error: Error }) => void;
} => {
  const mock = registerMock({ fn: readFile });

  return {
    returns: ({
      filePath,
      contents,
    }: {
      filePath: FilePath;
      contents: ReturnType<typeof FileContentsStub>;
    }) => {
      mock.calledWith([filePath]).resolves(contents);
    },

    throws: ({ filePath, error }: { filePath: FilePath; error: Error }) => {
      mock.calledWith([filePath]).rejects(error);
    },
  };
};
