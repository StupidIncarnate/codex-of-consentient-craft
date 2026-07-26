import { readFile } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';
import type { FileContents } from '../../../contracts/file-contents/file-contents-contract';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const fsReadFileAdapterProxy = (): {
  returns: ({ filePath, contents }: { filePath: FilePath; contents: FileContents }) => void;
  throws: ({ filePath, error }: { filePath: FilePath; error: Error }) => void;
  getHandle: () => MockHandle;
} => {
  const mock = registerMock({ fn: readFile });

  return {
    returns: ({ filePath, contents }: { filePath: FilePath; contents: FileContents }): void => {
      mock.calledWith([filePath]).resolves(contents);
    },
    throws: ({ filePath, error }: { filePath: FilePath; error: Error }): void => {
      mock.calledWith([filePath]).rejects(error);
    },
    getHandle: () => mock,
  };
};
