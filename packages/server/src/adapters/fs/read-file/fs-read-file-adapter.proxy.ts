import { readFile } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';
import type { FileContents } from '../../../contracts/file-contents/file-contents-contract';

export const fsReadFileAdapterProxy = (): {
  returns: ({ filepath, contents }: { filepath: FilePath; contents: FileContents }) => void;
  throws: ({ filepath, error }: { filepath: FilePath; error: Error }) => void;
} => {
  const mock = registerMock({ fn: readFile });

  mock.mockResolvedValue('');

  return {
    returns: ({ contents }: { filepath: FilePath; contents: FileContents }): void => {
      mock.mockResolvedValueOnce(contents);
    },
    throws: ({ error }: { filepath: FilePath; error: Error }): void => {
      mock.mockRejectedValueOnce(error);
    },
  };
};
