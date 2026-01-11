/**
 * PURPOSE: Proxy for quest-modify-broker that mocks folder ensure, folder find, and write operations
 *
 * USAGE:
 * const proxy = questModifyBrokerProxy();
 * proxy.setupQuestFound({ quest });
 */

import type { QuestStub } from '@dungeonmaster/shared/contracts';

import { questsFolderEnsureBrokerProxy } from '../../quests-folder/ensure/quests-folder-ensure-broker.proxy';
import { questFolderFindBrokerProxy } from '../folder-find/quest-folder-find-broker.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { FolderNameStub } from '../../../contracts/folder-name/folder-name.stub';
import { FileContentsStub } from '../../../contracts/file-contents/file-contents.stub';

type Quest = ReturnType<typeof QuestStub>;
type FileContents = ReturnType<typeof FileContentsStub>;

export const questModifyBrokerProxy = (): {
  setupQuestFound: (params: { quest: Quest }) => void;
  setupEmptyFolder: () => void;
} => {
  const folderEnsureProxy = questsFolderEnsureBrokerProxy();
  const folderFindProxy = questFolderFindBrokerProxy();
  const writeFileProxy = fsWriteFileAdapterProxy();
  const pathJoinProxy = pathJoinAdapterProxy();

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

      // Mock path join for write operation
      pathJoinProxy.returns({ paths: [], result: questFilePath });

      // Mock write operation
      writeFileProxy.succeeds({
        filepath: questFilePath,
        contents: '' as FileContents,
      });
    },

    setupEmptyFolder: (): void => {
      folderEnsureProxy.setupFolderExists();

      const questsPath = FilePathStub({ value: '/project/.dungeonmaster-quests' });
      folderFindProxy.setupEmptyFolder({ questsPath });
    },
  };
};
