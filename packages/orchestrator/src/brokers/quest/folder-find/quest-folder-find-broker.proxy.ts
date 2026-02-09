/**
 * PURPOSE: Proxy for quest-folder-find-broker that mocks filesystem operations
 *
 * USAGE:
 * const proxy = questFolderFindBrokerProxy();
 * proxy.setupQuestFolders({ questFolders, questFiles });
 */

import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';
import type { FilePath, FileContents } from '@dungeonmaster/shared/contracts';

import { fsReaddirAdapterProxy } from '../../../adapters/fs/readdir/fs-readdir-adapter.proxy';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import type { FileName } from '../../../contracts/file-name/file-name-contract';

export const questFolderFindBrokerProxy = (): {
  setupQuestFolders: (params: {
    questFolders: FileName[];
    questFiles: {
      folderPath: FilePath;
      questFilePath: FilePath;
      contents: FileContents;
    }[];
  }) => void;
  setupEmptyFolder: () => void;
  setupQuestFoldersWithMissingFile: (params: {
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
      questFolders,
      questFiles,
    }: {
      questFolders: FileName[];
      questFiles: {
        folderPath: FilePath;
        questFilePath: FilePath;
        contents: FileContents;
      }[];
    }): void => {
      readdirProxy.returns({ files: questFolders });

      // First: all folder paths
      for (const questFile of questFiles) {
        pathJoinProxy.returns({ result: questFile.folderPath });
      }

      // Second: all quest file paths and their file reads
      for (const questFile of questFiles) {
        pathJoinProxy.returns({ result: questFile.questFilePath });
        readFileProxy.resolves({ content: questFile.contents });
      }
    },

    setupEmptyFolder: (): void => {
      readdirProxy.returns({ files: [] });
    },

    setupQuestFoldersWithMissingFile: ({
      questFolders,
      missingFileFolder,
      validQuestFile,
    }: {
      questFolders: FileName[];
      missingFileFolder: FilePath;
      validQuestFile: {
        folderPath: FilePath;
        questFilePath: FilePath;
        contents: FileContents;
      };
    }): void => {
      readdirProxy.returns({ files: questFolders });

      // First: all folder paths (invalid folder, then valid folder)
      pathJoinProxy.returns({
        result: missingFileFolder.replace('/quest.json', '') as FilePath,
      });
      pathJoinProxy.returns({ result: validQuestFile.folderPath });

      // Second: all quest file paths (invalid first, then valid)
      pathJoinProxy.returns({ result: missingFileFolder });
      readFileProxy.rejects({
        error: new Error('ENOENT: no such file or directory'),
      });

      pathJoinProxy.returns({ result: validQuestFile.questFilePath });
      readFileProxy.resolves({ content: validQuestFile.contents });
    },
  };
};
