/**
 * PURPOSE: Proxy for quest-modify-broker that mocks folder ensure, folder find, and write operations
 *
 * USAGE:
 * const proxy = questModifyBrokerProxy();
 * proxy.setupQuestFound({ quest, startPath });
 */

import { questsFolderEnsureBrokerProxy, pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';
import { FileContentsStub, FilePathStub, type FilePath } from '@dungeonmaster/shared/contracts';
import type { QuestStub } from '@dungeonmaster/shared/contracts';

import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { FileNameStub } from '../../../contracts/file-name/file-name.stub';
import { questFolderFindBrokerProxy } from '../folder-find/quest-folder-find-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;

export const questModifyBrokerProxy = (): {
  setupQuestFound: (params: { quest: Quest; startPath: FilePath }) => void;
  setupEmptyFolder: (params: { startPath: FilePath }) => void;
} => {
  const questsFolderProxy = questsFolderEnsureBrokerProxy();
  const folderFindProxy = questFolderFindBrokerProxy();
  const writeFileProxy = fsWriteFileAdapterProxy();
  const pathJoinProxy = pathJoinAdapterProxy();

  return {
    setupQuestFound: ({ quest, startPath }: { quest: Quest; startPath: FilePath }): void => {
      const questsFolderPath = FilePathStub({ value: '/project/.dungeonmaster-quests' });
      const folderPath = FilePathStub({
        value: `/project/.dungeonmaster-quests/${quest.folder}`,
      });
      const questFilePath = FilePathStub({
        value: `/project/.dungeonmaster-quests/${quest.folder}/quest.json`,
      });

      const projectRootPath = questsFolderPath.split('/').slice(0, -1).join('/') as FilePath;
      questsFolderProxy.setupQuestsFolderEnsureSuccess({
        startPath,
        projectRootPath,
        questsFolderPath,
      });

      folderFindProxy.setupQuestFolders({
        questFolders: [FileNameStub({ value: quest.folder })],
        questFiles: [
          {
            folderPath,
            questFilePath,
            contents: FileContentsStub({ value: JSON.stringify(quest) }),
          },
        ],
      });

      // Mock path join for write operation
      pathJoinProxy.returns({ result: questFilePath });

      // Mock write operation
      writeFileProxy.succeeds();
    },

    setupEmptyFolder: ({ startPath }: { startPath: FilePath }): void => {
      const questsFolderPath = FilePathStub({ value: '/project/.dungeonmaster-quests' });

      const projectRootPath = questsFolderPath.split('/').slice(0, -1).join('/') as FilePath;
      questsFolderProxy.setupQuestsFolderEnsureSuccess({
        startPath,
        projectRootPath,
        questsFolderPath,
      });

      folderFindProxy.setupEmptyFolder();
    },
  };
};
