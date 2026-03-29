import { existsSync, readFileSync } from 'fs';
import type { FilePath, FileContents } from '@dungeonmaster/shared/contracts';
import { filePathContract } from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const fsEnsureReadFileSyncAdapterProxy = (): {
  returns: (args: { filePath: FilePath; contents: FileContents }) => void;
  throwsFileNotFound: () => void;
  setupFileSystem: (args: { getContents: (filePath: FilePath) => FileContents | null }) => void;
} => {
  const mockExistsSync = registerMock({ fn: existsSync });
  const mockReadFileSync = registerMock({ fn: readFileSync });

  // Set up default mock behavior
  mockExistsSync.mockReturnValue(false);
  mockReadFileSync.mockReturnValue('');

  return {
    returns: ({ contents }: { filePath: FilePath; contents: FileContents }): void => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(contents);
    },

    throwsFileNotFound: (): void => {
      mockExistsSync.mockReturnValue(false);
    },

    setupFileSystem: ({
      getContents,
    }: {
      getContents: (filePath: FilePath) => FileContents | null;
    }): void => {
      mockExistsSync.mockImplementation((path): boolean => {
        const filePath = filePathContract.parse(String(path));
        const contents = getContents(filePath);
        return contents !== null;
      });

      mockReadFileSync.mockImplementation((path) => {
        const filePath = filePathContract.parse(String(path));
        const contents = getContents(filePath);
        if (contents === null) {
          throw new Error(`File not found: ${String(path)}`);
        }
        return contents;
      });
    },
  };
};
