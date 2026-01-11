/**
 * PURPOSE: Proxy for quest-get-broker that mocks folder ensure and folder find operations
 *
 * USAGE:
 * const proxy = questGetBrokerProxy();
 * proxy.setupQuestFound({ quest });
 */

import type { QuestStub } from '@dungeonmaster/shared/contracts';

import { questsFolderEnsureBrokerProxy } from '../../quests-folder/ensure/quests-folder-ensure-broker.proxy';
import { questFolderFindBrokerProxy } from '../folder-find/quest-folder-find-broker.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { FolderNameStub } from '../../../contracts/folder-name/folder-name.stub';
import { FileContentsStub } from '../../../contracts/file-contents/file-contents.stub';

type Quest = ReturnType<typeof QuestStub>;

export const questGetBrokerProxy = (): {
  setupQuestFound: (params: { quest: Quest }) => void;
  setupEmptyFolder: () => void;
} => {
  const folderEnsureProxy = questsFolderEnsureBrokerProxy();
  const folderFindProxy = questFolderFindBrokerProxy();

  return {
    setupQuestFound: ({ quest }: { quest: Quest }): void => {
      folderEnsureProxy.setupFolderExists();

      const questsPath = FilePathStub({ value: '/project/.dungeonmaster-quests' });
      const folderPath = FilePathStub({ value: `/project/.dungeonmaster-quests/${quest.folder}` });
      const questFilePath = FilePathStub({
        value: `/project/.dungeonmaster-quests/${quest.folder}/quest.json`,
      });

      folderFindProxy.setupQuestFolders({
        questsPath,
        folders: [FolderNameStub({ value: quest.folder })],
        questFiles: [
          {
            folderPath,
            questFilePath,
            contents: FileContentsStub({ value: JSON.stringify(quest) }),
          },
        ],
      });
    },

    setupEmptyFolder: (): void => {
      folderEnsureProxy.setupFolderExists();

      const questsPath = FilePathStub({ value: '/project/.dungeonmaster-quests' });
      folderFindProxy.setupEmptyFolder({ questsPath });
    },
  };
};
