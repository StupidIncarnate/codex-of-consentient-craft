/**
 * PURPOSE: Proxy for quest-folder-find-broker that mocks filesystem operations
 *
 * USAGE:
 * const proxy = questFolderFindBrokerProxy();
 * proxy.setupQuestFolders({ questFolders, questFiles });
 */

import type { FileName } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';
import { readdirSyncProxy } from '#gateway/node/fs/readdir-sync/readdir-sync.proxy';
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';
import { join } from '#gateway/node/path';

export const questFolderFindBrokerProxy = (): {
  setupQuestFolders: (params: {
    questsPath: string;
    questFolders: FileName[];
    questFiles: {
      folderPath: string;
      questFilePath: string;
      contents: string;
    }[];
  }) => void;
  setupEmptyFolder: (params: { questsPath: string }) => void;
  setupQuestFoldersWithMissingFile: (params: {
    questsPath: string;
    questFolders: FileName[];
    missingFileFolder: string;
    validQuestFile: {
      folderPath: string;
      questFilePath: string;
      contents: string;
    };
  }) => void;
} => {
  const readdirProxy = readdirSyncProxy();
  const readFileHandle = readFileProxy();
  const joinHandle: MockHandle = registerMock({ fn: join });

  return {
    setupQuestFolders: ({
      questsPath,
      questFolders,
      questFiles,
    }: {
      questsPath: string;
      questFolders: FileName[];
      questFiles: {
        folderPath: string;
        questFilePath: string;
        contents: string;
      }[];
    }): void => {
      readdirProxy.returns({ path: questsPath, names: questFolders });

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
        readFileHandle.returns({
          path: questFile.questFilePath,
          contents: questFile.contents,
        });
      });
    },

    setupEmptyFolder: ({ questsPath }: { questsPath: string }): void => {
      readdirProxy.returns({ path: questsPath, names: [] });
    },

    setupQuestFoldersWithMissingFile: ({
      questsPath,
      questFolders,
      missingFileFolder,
      validQuestFile,
    }: {
      questsPath: string;
      questFolders: FileName[];
      missingFileFolder: string;
      validQuestFile: {
        folderPath: string;
        questFilePath: string;
        contents: string;
      };
    }): void => {
      readdirProxy.returns({ path: questsPath, names: questFolders });

      const [invalidFolderName, validFolderName] = questFolders;
      const missingFolderPath = missingFileFolder.replace(`/${locationsStatics.quest.questFile}`, '');

      if (invalidFolderName !== undefined) {
        joinHandle.calledWith([questsPath, invalidFolderName]).returns(missingFolderPath);
        joinHandle
          .calledWith([missingFolderPath, locationsStatics.quest.questFile])
          .returns(missingFileFolder);
      }
      readFileHandle.missing({ path: missingFileFolder });

      if (validFolderName !== undefined) {
        joinHandle.calledWith([questsPath, validFolderName]).returns(validQuestFile.folderPath);
        joinHandle
          .calledWith([validQuestFile.folderPath, locationsStatics.quest.questFile])
          .returns(validQuestFile.questFilePath);
      }
      readFileHandle.returns({
        path: validQuestFile.questFilePath,
        contents: validQuestFile.contents,
      });
    },
  };
};
