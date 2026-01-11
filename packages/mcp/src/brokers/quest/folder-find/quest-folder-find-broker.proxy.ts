/**
 * PURPOSE: Proxy for quest-folder-find-broker that mocks filesystem operations
 *
 * USAGE:
 * const proxy = questFolderFindBrokerProxy();
 * proxy.setupQuestFolders({ questsPath, folders, questFiles });
 */

import { fsReaddirAdapterProxy } from '../../../adapters/fs/readdir/fs-readdir-adapter.proxy';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';
import type { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import type { FolderNameStub } from '../../../contracts/folder-name/folder-name.stub';
import type { FileContentsStub } from '../../../contracts/file-contents/file-contents.stub';

type FilePath = ReturnType<typeof FilePathStub>;
type FolderName = ReturnType<typeof FolderNameStub>;
type FileContents = ReturnType<typeof FileContentsStub>;

export const questFolderFindBrokerProxy = (): {
  setupQuestFolders: (params: {
    questsPath: FilePath;
    folders: FolderName[];
    questFiles: {
      folderPath: FilePath;
      questFilePath: FilePath;
      contents: FileContents;
    }[];
  }) => void;
  setupEmptyFolder: (params: { questsPath: FilePath }) => void;
  setupQuestFoldersWithMissingFile: (params: {
    questsPath: FilePath;
    folders: FolderName[];
    missingFileFolder: FilePath;
    validQuestFile: {
      folderPath: FilePath;
      questFilePath: FilePath;
      contents: FileContents;
    };
  }) => void;
} => {
  const readdirProxy = fsReaddirAdapterProxy();
  const readFileProxy = fsReadFileAdapterProxy();
  const pathJoinProxy = pathJoinAdapterProxy();

  return {
    setupQuestFolders: ({
      questsPath,
      folders,
      questFiles,
    }: {
      questsPath: FilePath;
      folders: FolderName[];
      questFiles: {
        folderPath: FilePath;
        questFilePath: FilePath;
        contents: FileContents;
      }[];
    }): void => {
      // Mock readdir to return folders
      readdirProxy.returns({ filepath: questsPath, entries: folders });

      // With Promise.all pattern:
      // 1. First all folder paths are created (in map before Promise.all)
      // 2. Then all quest file paths are created (inside Promise.all callbacks)
      // So order is: folderPath1, folderPath2, ..., questFilePath1, questFilePath2, ...

      // First: all folder paths
      for (const questFile of questFiles) {
        pathJoinProxy.returns({ paths: [], result: questFile.folderPath });
      }

      // Second: all quest file paths and their file reads
      for (const questFile of questFiles) {
        pathJoinProxy.returns({ paths: [], result: questFile.questFilePath });
        readFileProxy.returns({ filepath: questFile.questFilePath, contents: questFile.contents });
      }
    },

    setupEmptyFolder: ({ questsPath }: { questsPath: FilePath }): void => {
      readdirProxy.returns({ filepath: questsPath, entries: [] });
    },

    setupQuestFoldersWithMissingFile: ({
      questsPath,
      folders,
      missingFileFolder,
      validQuestFile,
    }: {
      questsPath: FilePath;
      folders: FolderName[];
      missingFileFolder: FilePath;
      validQuestFile: {
        folderPath: FilePath;
        questFilePath: FilePath;
        contents: FileContents;
      };
    }): void => {
      // Mock readdir to return folders
      readdirProxy.returns({ filepath: questsPath, entries: folders });

      // First: all folder paths (invalid folder, then valid folder)
      pathJoinProxy.returns({
        paths: [],
        result: missingFileFolder.replace('/quest.json', '') as FilePath,
      });
      pathJoinProxy.returns({ paths: [], result: validQuestFile.folderPath });

      // Second: all quest file paths (invalid first, then valid)
      pathJoinProxy.returns({ paths: [], result: missingFileFolder });
      readFileProxy.throws({
        filepath: missingFileFolder,
        error: new Error('ENOENT: no such file or directory'),
      });

      pathJoinProxy.returns({ paths: [], result: validQuestFile.questFilePath });
      readFileProxy.returns({
        filepath: validQuestFile.questFilePath,
        contents: validQuestFile.contents,
      });
    },
  };
};
