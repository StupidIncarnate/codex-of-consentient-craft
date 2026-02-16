import { readFile } from 'fs/promises';
import type * as FsPromises from 'fs/promises';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';
import type { FileContents } from '../../../contracts/file-contents/file-contents-contract';

jest.mock('fs/promises');

export const fsReadFileAdapterProxy = (): {
  returns: ({ filepath, contents }: { filepath: FilePath; contents: FileContents }) => void;
  throws: ({ filepath, error }: { filepath: FilePath; error: Error }) => void;
} => {
  const mockReadFile = jest.mocked(readFile);

  mockReadFile.mockImplementation(async (path) => {
    const actualFs = jest.requireActual<typeof FsPromises>('fs/promises');
    return actualFs.readFile(path, 'utf-8');
  });

  return {
    returns: ({ contents }: { filepath: FilePath; contents: FileContents }): void => {
      mockReadFile.mockResolvedValueOnce(contents);
    },
    throws: ({ error }: { filepath: FilePath; error: Error }): void => {
      mockReadFile.mockRejectedValueOnce(error);
    },
  };
};
