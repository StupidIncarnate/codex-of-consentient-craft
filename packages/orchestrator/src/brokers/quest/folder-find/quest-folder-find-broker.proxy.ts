/**
 * PURPOSE: Proxy for quest-folder-find-broker that mocks filesystem operations
 *
 * USAGE:
 * const proxy = questFolderFindBrokerProxy();
 * proxy.setupQuestFolders({ questFolders, questFiles });
 */

import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';
import type { FilePath, FileContents, FileName } from '@dungeonmaster/shared/contracts';

import { fsReaddirAdapterProxy } from '../../../adapters/fs/readdir/fs-readdir-adapter.proxy';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';

export const questFolderFindBrokerProxy = (): {
  setupQuestFolders: (params: {
    questsPath: FilePath;
    questFolders: FileName[];
    questFiles: {
      folderPath: FilePath;
      questFilePath: FilePath;
      contents: FileContents;
    }[];
  }) => void;
  setupEmptyFolder: (params: { questsPath: FilePath }) => void;
  setupQuestFoldersWithMissingFile: (params: {
    questsPath: FilePath;
    questFolders: FileName[];
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
      questFolders,
      questFiles,
    }: {
      questsPath: FilePath;
      questFolders: FileName[];
      questFiles: {
        folderPath: FilePath;
        questFilePath: FilePath;
        contents: FileContents;
      }[];
    }): void => {
      readdirProxy.returns({ dirPath: questsPath, files: questFolders });

      // First: all folder paths
      for (const questFile of questFiles) {
        pathJoinProxy.returns({ result: questFile.folderPath });
      }

      // Second: all quest file paths and their file reads
      for (const questFile of questFiles) {
        pathJoinProxy.returns({ result: questFile.questFilePath });
        readFileProxy.resolves({
          filePath: questFile.questFilePath,
          content: questFile.contents,
        });
      }
    },

    setupEmptyFolder: ({ questsPath }: { questsPath: FilePath }): void => {
      readdirProxy.returns({ dirPath: questsPath, files: [] });
    },

    setupQuestFoldersWithMissingFile: ({
      questsPath,
      questFolders,
      missingFileFolder,
      validQuestFile,
    }: {
      questsPath: FilePath;
      questFolders: FileName[];
      missingFileFolder: FilePath;
      validQuestFile: {
        folderPath: FilePath;
        questFilePath: FilePath;
        contents: FileContents;
      };
    }): void => {
      readdirProxy.returns({ dirPath: questsPath, files: questFolders });

      // First: all folder paths (invalid folder, then valid folder)
      pathJoinProxy.returns({
        result: missingFileFolder.replace('/quest.json', '') as FilePath,
      });
      pathJoinProxy.returns({ result: validQuestFile.folderPath });

      // Second: all quest file paths (invalid first, then valid)
      pathJoinProxy.returns({ result: missingFileFolder });
      readFileProxy.rejects({
        filePath: missingFileFolder,
        error: new Error('ENOENT: no such file or directory'),
      });

      pathJoinProxy.returns({ result: validQuestFile.questFilePath });
      readFileProxy.resolves({
        filePath: validQuestFile.questFilePath,
        content: validQuestFile.contents,
      });
    },
  };
};
