import { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';

import { FileNameStub } from '@dungeonmaster/shared/contracts/file-name/file-name.stub';
import { questFolderFindBroker } from './quest-folder-find-broker';
import { questFolderFindBrokerProxy } from './quest-folder-find-broker.proxy';

describe('questFolderFindBroker', () => {
  describe('quest found', () => {
    it('VALID: {questId exists in single folder} => returns folder path and quest', async () => {
      const proxy = questFolderFindBrokerProxy();
      const questsPath = '/project/.dungeonmaster-quests';
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth' });

      proxy.setupQuestFolders({
        questsPath,
        questFolders: [FileNameStub({ value: '001-add-auth' })],
        questFiles: [
          {
            folderPath: '/project/.dungeonmaster-quests/001-add-auth',
            questFilePath: '/project/.dungeonmaster-quests/001-add-auth/quest.json',
            contents: JSON.stringify(quest),
          },
        ],
      });

      const result = await questFolderFindBroker({ questId: 'add-auth' as never, questsPath });

      expect(result).toStrictEqual({
        found: true,
        folderPath: '/project/.dungeonmaster-quests/001-add-auth',
        quest,
      });
    });

    it('VALID: {questId exists in multiple folders} => returns matching folder', async () => {
      const proxy = questFolderFindBrokerProxy();
      const questsPath = '/project/.dungeonmaster-quests';
      const quest1 = QuestStub({ id: 'add-auth', folder: '001-add-auth' });
      const quest2 = QuestStub({ id: 'fix-bug', folder: '002-fix-bug' });

      proxy.setupQuestFolders({
        questsPath,
        questFolders: [
          FileNameStub({ value: '001-add-auth' }),
          FileNameStub({ value: '002-fix-bug' }),
        ],
        questFiles: [
          {
            folderPath: '/project/.dungeonmaster-quests/001-add-auth',
            questFilePath: '/project/.dungeonmaster-quests/001-add-auth/quest.json',
            contents: JSON.stringify(quest1),
          },
          {
            folderPath: '/project/.dungeonmaster-quests/002-fix-bug',
            questFilePath: '/project/.dungeonmaster-quests/002-fix-bug/quest.json',
            contents: JSON.stringify(quest2),
          },
        ],
      });

      const result = await questFolderFindBroker({ questId: 'fix-bug' as never, questsPath });

      expect(result).toStrictEqual({
        found: true,
        folderPath: '/project/.dungeonmaster-quests/002-fix-bug',
        quest: quest2,
      });
    });
  });

  describe('quest not found', () => {
    it('VALID: {questId not exists} => returns not found', async () => {
      const proxy = questFolderFindBrokerProxy();
      const questsPath = '/project/.dungeonmaster-quests';
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth' });

      proxy.setupQuestFolders({
        questsPath,
        questFolders: [FileNameStub({ value: '001-add-auth' })],
        questFiles: [
          {
            folderPath: '/project/.dungeonmaster-quests/001-add-auth',
            questFilePath: '/project/.dungeonmaster-quests/001-add-auth/quest.json',
            contents: JSON.stringify(quest),
          },
        ],
      });

      const result = await questFolderFindBroker({
        questId: 'nonexistent' as never,
        questsPath,
      });

      expect(result).toStrictEqual({
        found: false,
        folderPath: undefined,
        quest: undefined,
      });
    });

    it('VALID: {empty folder} => returns not found', async () => {
      const proxy = questFolderFindBrokerProxy();
      const questsPath = '/project/.dungeonmaster-quests';

      proxy.setupEmptyFolder({ questsPath });

      const result = await questFolderFindBroker({ questId: 'any-quest' as never, questsPath });

      expect(result).toStrictEqual({
        found: false,
        folderPath: undefined,
        quest: undefined,
      });
    });
  });

  describe('error handling', () => {
    it('VALID: {folder without quest.json} => skips folder, continues search', async () => {
      const proxy = questFolderFindBrokerProxy();
      const questsPath = '/project/.dungeonmaster-quests';
      const quest = QuestStub({ id: 'add-auth', folder: '002-add-auth' });

      proxy.setupQuestFoldersWithMissingFile({
        questsPath,
        questFolders: [
          FileNameStub({ value: '001-invalid' }),
          FileNameStub({ value: '002-add-auth' }),
        ],
        missingFileFolder: '/project/.dungeonmaster-quests/001-invalid/quest.json',
        validQuestFile: {
          folderPath: '/project/.dungeonmaster-quests/002-add-auth',
          questFilePath: '/project/.dungeonmaster-quests/002-add-auth/quest.json',
          contents: JSON.stringify(quest),
        },
      });

      const result = await questFolderFindBroker({ questId: 'add-auth' as never, questsPath });

      expect(result).toStrictEqual({
        found: true,
        folderPath: '/project/.dungeonmaster-quests/002-add-auth',
        quest,
      });
    });
  });
});
