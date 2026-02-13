import {
  FileContentsStub,
  FileNameStub,
  FilePathStub,
  QuestIdStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

import { questFindQuestPathBroker } from './quest-find-quest-path-broker';
import { questFindQuestPathBrokerProxy } from './quest-find-quest-path-broker.proxy';

describe('questFindQuestPathBroker', () => {
  describe('quest found', () => {
    it('VALID: {questId in single project} => returns quest path and project id', async () => {
      const proxy = questFindQuestPathBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth' });
      const projectId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

      proxy.setupQuestFound({
        homeDir: '/home/user',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
        projectsDir: FilePathStub({ value: '/home/user/.dungeonmaster/projects' }),
        projects: [
          {
            dirName: FileNameStub({ value: projectId }),
            questsDirPath: FilePathStub({
              value: `/home/user/.dungeonmaster/projects/${projectId}/quests`,
            }),
            questFolders: [
              {
                folderName: FileNameStub({ value: '001-add-auth' }),
                questFilePath: FilePathStub({
                  value: `/home/user/.dungeonmaster/projects/${projectId}/quests/001-add-auth/quest.json`,
                }),
                questFolderPath: FilePathStub({
                  value: `/home/user/.dungeonmaster/projects/${projectId}/quests/001-add-auth`,
                }),
                contents: FileContentsStub({ value: JSON.stringify(quest) }),
              },
            ],
          },
        ],
      });

      const result = await questFindQuestPathBroker({ questId });

      expect(result.questPath).toBe(
        `/home/user/.dungeonmaster/projects/${projectId}/quests/001-add-auth`,
      );
      expect(result.projectId).toBe(projectId);
    });

    it('VALID: {questId in second project} => returns correct project', async () => {
      const proxy = questFindQuestPathBrokerProxy();
      const questId = QuestIdStub({ value: 'fix-bug' });
      const quest1 = QuestStub({ id: 'add-auth', folder: '001-add-auth' });
      const quest2 = QuestStub({ id: 'fix-bug', folder: '001-fix-bug' });
      const projectId1 = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
      const projectId2 = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

      proxy.setupQuestFound({
        homeDir: '/home/user',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
        projectsDir: FilePathStub({ value: '/home/user/.dungeonmaster/projects' }),
        projects: [
          {
            dirName: FileNameStub({ value: projectId1 }),
            questsDirPath: FilePathStub({
              value: `/home/user/.dungeonmaster/projects/${projectId1}/quests`,
            }),
            questFolders: [
              {
                folderName: FileNameStub({ value: '001-add-auth' }),
                questFilePath: FilePathStub({
                  value: `/home/user/.dungeonmaster/projects/${projectId1}/quests/001-add-auth/quest.json`,
                }),
                questFolderPath: FilePathStub({
                  value: `/home/user/.dungeonmaster/projects/${projectId1}/quests/001-add-auth`,
                }),
                contents: FileContentsStub({ value: JSON.stringify(quest1) }),
              },
            ],
          },
          {
            dirName: FileNameStub({ value: projectId2 }),
            questsDirPath: FilePathStub({
              value: `/home/user/.dungeonmaster/projects/${projectId2}/quests`,
            }),
            questFolders: [
              {
                folderName: FileNameStub({ value: '001-fix-bug' }),
                questFilePath: FilePathStub({
                  value: `/home/user/.dungeonmaster/projects/${projectId2}/quests/001-fix-bug/quest.json`,
                }),
                questFolderPath: FilePathStub({
                  value: `/home/user/.dungeonmaster/projects/${projectId2}/quests/001-fix-bug`,
                }),
                contents: FileContentsStub({ value: JSON.stringify(quest2) }),
              },
            ],
          },
        ],
      });

      const result = await questFindQuestPathBroker({ questId });

      expect(result.questPath).toBe(
        `/home/user/.dungeonmaster/projects/${projectId2}/quests/001-fix-bug`,
      );
      expect(result.projectId).toBe(projectId2);
    });
  });

  describe('quest not found', () => {
    it('ERROR: {no projects exist} => throws quest not found', async () => {
      const proxy = questFindQuestPathBrokerProxy();
      const questId = QuestIdStub({ value: 'nonexistent' });

      proxy.setupNoProjects({
        homeDir: '/home/user',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
        projectsDir: FilePathStub({ value: '/home/user/.dungeonmaster/projects' }),
      });

      await expect(questFindQuestPathBroker({ questId })).rejects.toThrow(
        /Quest with id "nonexistent" not found in any project/u,
      );
    });

    it('ERROR: {questId not in any project} => throws quest not found', async () => {
      const proxy = questFindQuestPathBrokerProxy();
      const questId = QuestIdStub({ value: 'nonexistent' });
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth' });
      const projectId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

      proxy.setupQuestNotFound({
        homeDir: '/home/user',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
        projectsDir: FilePathStub({ value: '/home/user/.dungeonmaster/projects' }),
        projects: [
          {
            dirName: FileNameStub({ value: projectId }),
            questsDirPath: FilePathStub({
              value: `/home/user/.dungeonmaster/projects/${projectId}/quests`,
            }),
            questFolders: [
              {
                folderName: FileNameStub({ value: '001-add-auth' }),
                questFilePath: FilePathStub({
                  value: `/home/user/.dungeonmaster/projects/${projectId}/quests/001-add-auth/quest.json`,
                }),
                questFolderPath: FilePathStub({
                  value: `/home/user/.dungeonmaster/projects/${projectId}/quests/001-add-auth`,
                }),
                contents: FileContentsStub({ value: JSON.stringify(quest) }),
              },
            ],
          },
        ],
      });

      await expect(questFindQuestPathBroker({ questId })).rejects.toThrow(
        /Quest with id "nonexistent" not found in any project/u,
      );
    });
  });

  describe('error handling', () => {
    it('VALID: {project with inaccessible quests dir} => skips project and throws not found', async () => {
      const proxy = questFindQuestPathBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const projectId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

      proxy.setupQuestsReadError({
        homeDir: '/home/user',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
        projectsDir: FilePathStub({ value: '/home/user/.dungeonmaster/projects' }),
        projectDirName: FileNameStub({ value: projectId }),
      });

      await expect(questFindQuestPathBroker({ questId })).rejects.toThrow(
        /Quest with id "add-auth" not found in any project/u,
      );
    });
  });
});
