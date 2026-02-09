/**
 * PURPOSE: Proxy for quest-add-broker that mocks filesystem and path operations
 *
 * USAGE:
 * const brokerProxy = questAddBrokerProxy();
 * brokerProxy.setupQuestCreation({ questsFolderPath, existingFolders, questFolderPath, questFilePath });
 */

import {
  pathJoinAdapterProxy,
  questsFolderEnsureBrokerProxy,
  fsMkdirAdapterProxy,
} from '@dungeonmaster/shared/testing';
import type { FilePath } from '@dungeonmaster/shared/contracts';

import { fsReaddirAdapterProxy } from '../../../adapters/fs/readdir/fs-readdir-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import type { FileName } from '../../../contracts/file-name/file-name-contract';

export const questAddBrokerProxy = (): {
  setupQuestCreation: (params: {
    startPath: FilePath;
    questsFolderPath: FilePath;
    existingFolders: FileName[];
    questFolderPath: FilePath;
    questFilePath: FilePath;
  }) => void;
  setupQuestCreationFailure: (params: {
    startPath: FilePath;
    questsFolderPath: FilePath;
    error: Error;
  }) => void;
} => {
  const questsFolderProxy = questsFolderEnsureBrokerProxy();
  const mkdirProxy = fsMkdirAdapterProxy();
  const readdirProxy = fsReaddirAdapterProxy();
  const writeFileProxy = fsWriteFileAdapterProxy();
  const pathJoinProxy = pathJoinAdapterProxy();

  return {
    setupQuestCreation: ({
      startPath,
      questsFolderPath,
      existingFolders,
      questFolderPath,
      questFilePath,
    }: {
      startPath: FilePath;
      questsFolderPath: FilePath;
      existingFolders: FileName[];
      questFolderPath: FilePath;
      questFilePath: FilePath;
    }): void => {
      const projectRootPath = questsFolderPath.split('/').slice(0, -1).join('/') as FilePath;
      questsFolderProxy.setupQuestsFolderEnsureSuccess({
        startPath,
        projectRootPath,
        questsFolderPath,
      });

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
      startPath,
      questsFolderPath,
      error,
    }: {
      startPath: FilePath;
      questsFolderPath: FilePath;
      error: Error;
    }): void => {
      const projectRootPath = questsFolderPath.split('/').slice(0, -1).join('/') as FilePath;
      questsFolderProxy.setupQuestsFolderMkdirFails({
        startPath,
        projectRootPath,
        questsFolderPath,
        error,
      });
    },
  };
};
