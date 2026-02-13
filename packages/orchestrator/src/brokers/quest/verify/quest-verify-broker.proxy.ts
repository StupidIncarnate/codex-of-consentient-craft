/**
 * PURPOSE: Proxy for quest-verify-broker that mocks quest find and quest load operations
 *
 * USAGE:
 * const proxy = questVerifyBrokerProxy();
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

import { questFindQuestPathBrokerProxy } from '../find-quest-path/quest-find-quest-path-broker.proxy';
import { questLoadBrokerProxy } from '../load/quest-load-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;

export const questVerifyBrokerProxy = (): {
  setupQuestFound: (params: { quest: Quest }) => void;
  setupEmptyFolder: () => void;
} => {
  const findQuestPathProxy = questFindQuestPathBrokerProxy();
  const pathJoinProxy = pathJoinAdapterProxy();
  const loadProxy = questLoadBrokerProxy();

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

      // pathJoin for questVerifyBroker joining questPath + quest.json
      pathJoinProxy.returns({ result: questFilePath });

      // questLoadBroker reads the quest file
      loadProxy.setupQuestFile({ questJson: JSON.stringify(quest) });
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
