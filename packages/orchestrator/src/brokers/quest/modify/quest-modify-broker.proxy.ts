/**
 * PURPOSE: Proxy for quest-modify-broker that mocks quest find, quest load, and write operations
 *
 * USAGE:
 * const proxy = questModifyBrokerProxy();
 * proxy.setupQuestFound({ quest });
 */

import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';
import {
  FileContentsStub,
  FileNameStub,
  FilePathStub,
  ProjectIdStub,
} from '@dungeonmaster/shared/contracts';
import type { QuestStub } from '@dungeonmaster/shared/contracts';

import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { questFindQuestPathBrokerProxy } from '../find-quest-path/quest-find-quest-path-broker.proxy';
import { questLoadBrokerProxy } from '../load/quest-load-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;

export const questModifyBrokerProxy = (): {
  setupQuestFound: (params: { quest: Quest }) => void;
  setupEmptyFolder: () => void;
} => {
  const findQuestPathProxy = questFindQuestPathBrokerProxy();
  const pathJoinProxy = pathJoinAdapterProxy();
  const loadProxy = questLoadBrokerProxy();
  const writeFileProxy = fsWriteFileAdapterProxy();

  return {
    setupQuestFound: ({ quest }: { quest: Quest }): void => {
      const projectId = ProjectIdStub();
      const homePath = FilePathStub({ value: '/home/testuser/.dungeonmaster' });
      const projectsDir = FilePathStub({
        value: '/home/testuser/.dungeonmaster/projects',
      });
      const questsDirPath = FilePathStub({
        value: `/home/testuser/.dungeonmaster/projects/${projectId}/quests`,
      });
      const questFolderPath = FilePathStub({
        value: `/home/testuser/.dungeonmaster/projects/${projectId}/quests/${quest.folder}`,
      });
      const questFilePath = FilePathStub({
        value: `/home/testuser/.dungeonmaster/projects/${projectId}/quests/${quest.folder}/quest.json`,
      });

      findQuestPathProxy.setupQuestFound({
        homeDir: '/home/testuser',
        homePath,
        projectsDir,
        projects: [
          {
            dirName: FileNameStub({ value: projectId }),
            questsDirPath,
            questFolders: [
              {
                folderName: FileNameStub({ value: quest.folder }),
                questFilePath,
                questFolderPath,
                contents: FileContentsStub({ value: JSON.stringify(quest) }),
              },
            ],
          },
        ],
      });

      // pathJoin for questModifyBroker joining questPath + quest.json
      pathJoinProxy.returns({ result: questFilePath });

      // questLoadBroker reads the quest file
      loadProxy.setupQuestFile({ questJson: JSON.stringify(quest) });

      // Mock write operation
      writeFileProxy.succeeds();
    },

    setupEmptyFolder: (): void => {
      const homePath = FilePathStub({ value: '/home/testuser/.dungeonmaster' });
      const projectsDir = FilePathStub({
        value: '/home/testuser/.dungeonmaster/projects',
      });

      findQuestPathProxy.setupNoProjects({
        homeDir: '/home/testuser',
        homePath,
        projectsDir,
      });
    },
  };
};
