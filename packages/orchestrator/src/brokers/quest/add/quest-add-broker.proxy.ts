/**
 * PURPOSE: Proxy for quest-add-broker that mocks filesystem and path operations
 *
 * USAGE:
 * const brokerProxy = questAddBrokerProxy();
 * brokerProxy.setupQuestCreation({ questsFolderPath, existingFolders, questFolderPath, questFilePath });
 */

import { pathJoinAdapterProxy, fsMkdirAdapterProxy } from '@dungeonmaster/shared/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import type { FilePath } from '@dungeonmaster/shared/contracts';

import { fsReaddirAdapterProxy } from '../../../adapters/fs/readdir/fs-readdir-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import type { FileName } from '../../../contracts/file-name/file-name-contract';
import { questResolveQuestsPathBrokerProxy } from '../resolve-quests-path/quest-resolve-quests-path-broker.proxy';

export const questAddBrokerProxy = (): {
  setupQuestCreation: (params: {
    questsFolderPath: FilePath;
    existingFolders: FileName[];
    questFolderPath: FilePath;
    questFilePath: FilePath;
  }) => void;
  setupQuestCreationFailure: (params: { questsFolderPath: FilePath; error: Error }) => void;
} => {
  const resolveQuestsPathProxy = questResolveQuestsPathBrokerProxy();
  const mkdirProxy = fsMkdirAdapterProxy();
  const readdirProxy = fsReaddirAdapterProxy();
  const writeFileProxy = fsWriteFileAdapterProxy();
  const pathJoinProxy = pathJoinAdapterProxy();

  return {
    setupQuestCreation: ({
      questsFolderPath,
      existingFolders,
      questFolderPath,
      questFilePath,
    }: {
      questsFolderPath: FilePath;
      existingFolders: FileName[];
      questFolderPath: FilePath;
      questFilePath: FilePath;
    }): void => {
      const homePath = FilePathStub({ value: '/home/testuser/.dungeonmaster' });
      resolveQuestsPathProxy.setupQuestsPath({
        homeDir: '/home/testuser',
        homePath,
        questsPath: questsFolderPath,
      });

      // Mock mkdir for quests base directory
      mkdirProxy.succeeds({ filepath: questsFolderPath });

      // Mock readdir for existing folders
      readdirProxy.returns({ files: existingFolders });

      // Mock path joins (questFolderPath, questFilePath)
      pathJoinProxy.returns({ result: questFolderPath });
      pathJoinProxy.returns({ result: questFilePath });

      // Mock mkdir for quest folder
      mkdirProxy.succeeds({ filepath: questFolderPath });

      // Mock file write
      writeFileProxy.succeeds();
    },

    setupQuestCreationFailure: ({
      questsFolderPath,
      error,
    }: {
      questsFolderPath: FilePath;
      error: Error;
    }): void => {
      const homePath = FilePathStub({ value: '/home/testuser/.dungeonmaster' });
      resolveQuestsPathProxy.setupQuestsPath({
        homeDir: '/home/testuser',
        homePath,
        questsPath: questsFolderPath,
      });

      // Mock mkdir failure for quests base directory
      mkdirProxy.throws({ filepath: questsFolderPath, error });
    },
  };
};
