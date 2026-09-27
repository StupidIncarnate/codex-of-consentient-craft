/**
 * PURPOSE: Proxy for quest-folder-find-broker that mocks filesystem operations
 *
 * USAGE:
 * const proxy = questFolderFindBrokerProxy();
 * proxy.setupQuestFolders({ questFolders, questFiles });
 */

import { filePathContract } from '@dungeonmaster/shared/contracts';
import type { FilePath, FileContents, FileName } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';
import { join } from '#gateway/node/path';

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
  const joinHandle: MockHandle = registerMock({ fn: join });

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

      // Folder name and quest file are paired by index — questFolders and questFiles are parallel
      // arrays every caller passes in the same order, which is what lets the real folder-name
      // segment (known only at readdir time) address the exact join the broker will make.
      questFolders.forEach((folderName, index) => {
        const questFile = questFiles[index];

        if (questFile === undefined) {
          return;
        }

        joinHandle.calledWith([questsPath, folderName]).returns(questFile.folderPath);
        joinHandle
          .calledWith([questFile.folderPath, locationsStatics.quest.questFile])
          .returns(questFile.questFilePath);
        readFileProxy.resolves({
          filePath: questFile.questFilePath,
          content: questFile.contents,
        });
      });
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

      const [invalidFolderName, validFolderName] = questFolders;
      const missingFolderPath = filePathContract.parse(
        missingFileFolder.replace(`/${locationsStatics.quest.questFile}`, ''),
      );

      if (invalidFolderName !== undefined) {
        joinHandle.calledWith([questsPath, invalidFolderName]).returns(missingFolderPath);
        joinHandle
          .calledWith([missingFolderPath, locationsStatics.quest.questFile])
          .returns(missingFileFolder);
      }
      readFileProxy.rejects({
        filePath: missingFileFolder,
        error: new Error('ENOENT: no such file or directory'),
      });

      if (validFolderName !== undefined) {
        joinHandle.calledWith([questsPath, validFolderName]).returns(validQuestFile.folderPath);
        joinHandle
          .calledWith([validQuestFile.folderPath, locationsStatics.quest.questFile])
          .returns(validQuestFile.questFilePath);
      }
      readFileProxy.resolves({
        filePath: validQuestFile.questFilePath,
        content: validQuestFile.contents,
      });
    },
  };
};
