import { existsSync, readFileSync } from 'fs';
import type { FilePath, FileContents } from '@dungeonmaster/shared/contracts';
import { filePathContract } from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const fsEnsureReadFileSyncAdapterProxy = (): {
  returns: (args: { filePath: FilePath; contents: FileContents }) => void;
  throwsFileNotFound: (args: { filePath: FilePath }) => void;
  setupFileSystem: (args: { getContents: (filePath: FilePath) => FileContents | null }) => void;
} => {
  const mockExistsSync = registerMock({ fn: existsSync });
  const mockReadFileSync = registerMock({ fn: readFileSync });

  return {
    returns: ({ filePath, contents }: { filePath: FilePath; contents: FileContents }): void => {
      mockExistsSync.calledWith([filePath]).returns(true);
      mockReadFileSync.calledWith([filePath]).returns(contents);
    },

    throwsFileNotFound: ({ filePath }: { filePath: FilePath }): void => {
      mockExistsSync.calledWith([filePath]).returns(false);
    },

    setupFileSystem: ({
      getContents,
    }: {
      getContents: (filePath: FilePath) => FileContents | null;
    }): void => {
      // No single path to key on: the rule under test probes many candidate paths decided
      // entirely by the caller-supplied getContents callback, so [] is the honest address.
      mockExistsSync.calledWith([]).implement((path): boolean => {
        const filePath = filePathContract.parse(String(path));
        const contents = getContents(filePath);
        return contents !== null;
      });

      mockReadFileSync.calledWith([]).implement((path) => {
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
