import { QuestStub } from '@dungeonmaster/shared/contracts';

import { questFolderFindBroker } from './quest-folder-find-broker';
import { questFolderFindBrokerProxy } from './quest-folder-find-broker.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { FolderNameStub } from '../../../contracts/folder-name/folder-name.stub';
import { FileContentsStub } from '../../../contracts/file-contents/file-contents.stub';

describe('questFolderFindBroker', () => {
  describe('quest found', () => {
    it('VALID: {questId exists in single folder} => returns folder path and quest', async () => {
      const proxy = questFolderFindBrokerProxy();
      const questsPath = FilePathStub({ value: '/project/.dungeonmaster-quests' });
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth' });

      proxy.setupQuestFolders({
        questsPath,
        folders: [FolderNameStub({ value: '001-add-auth' })],
        questFiles: [
          {
            folderPath: FilePathStub({ value: '/project/.dungeonmaster-quests/001-add-auth' }),
            questFilePath: FilePathStub({
              value: '/project/.dungeonmaster-quests/001-add-auth/quest.json',
            }),
            contents: FileContentsStub({ value: JSON.stringify(quest) }),
          },
        ],
      });

      const result = await questFolderFindBroker({ questId: 'add-auth', questsPath });

      expect(result.found).toBe(true);
      expect(result.folderPath).toBe('/project/.dungeonmaster-quests/001-add-auth');
      expect(result.quest?.id).toBe('add-auth');
    });

    it('VALID: {questId exists in multiple folders} => returns matching folder', async () => {
      const proxy = questFolderFindBrokerProxy();
      const questsPath = FilePathStub({ value: '/project/.dungeonmaster-quests' });
      const quest1 = QuestStub({ id: 'add-auth', folder: '001-add-auth' });
      const quest2 = QuestStub({ id: 'fix-bug', folder: '002-fix-bug' });

      proxy.setupQuestFolders({
        questsPath,
        folders: [
          FolderNameStub({ value: '001-add-auth' }),
          FolderNameStub({ value: '002-fix-bug' }),
        ],
        questFiles: [
          {
            folderPath: FilePathStub({ value: '/project/.dungeonmaster-quests/001-add-auth' }),
            questFilePath: FilePathStub({
              value: '/project/.dungeonmaster-quests/001-add-auth/quest.json',
            }),
            contents: FileContentsStub({ value: JSON.stringify(quest1) }),
          },
          {
            folderPath: FilePathStub({ value: '/project/.dungeonmaster-quests/002-fix-bug' }),
            questFilePath: FilePathStub({
              value: '/project/.dungeonmaster-quests/002-fix-bug/quest.json',
            }),
            contents: FileContentsStub({ value: JSON.stringify(quest2) }),
          },
        ],
      });

      const result = await questFolderFindBroker({ questId: 'fix-bug', questsPath });

      expect(result.found).toBe(true);
      expect(result.folderPath).toBe('/project/.dungeonmaster-quests/002-fix-bug');
      expect(result.quest?.id).toBe('fix-bug');
    });
  });

  describe('quest not found', () => {
    it('VALID: {questId not exists} => returns not found', async () => {
      const proxy = questFolderFindBrokerProxy();
      const questsPath = FilePathStub({ value: '/project/.dungeonmaster-quests' });
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth' });

      proxy.setupQuestFolders({
        questsPath,
        folders: [FolderNameStub({ value: '001-add-auth' })],
        questFiles: [
          {
            folderPath: FilePathStub({ value: '/project/.dungeonmaster-quests/001-add-auth' }),
            questFilePath: FilePathStub({
              value: '/project/.dungeonmaster-quests/001-add-auth/quest.json',
            }),
            contents: FileContentsStub({ value: JSON.stringify(quest) }),
          },
        ],
      });

      const result = await questFolderFindBroker({ questId: 'nonexistent', questsPath });

      expect(result.found).toBe(false);
      expect(result.folderPath).toBeUndefined();
      expect(result.quest).toBeUndefined();
    });

    it('VALID: {empty folder} => returns not found', async () => {
      const proxy = questFolderFindBrokerProxy();
      const questsPath = FilePathStub({ value: '/project/.dungeonmaster-quests' });

      proxy.setupEmptyFolder({ questsPath });

      const result = await questFolderFindBroker({ questId: 'any-quest', questsPath });

      expect(result.found).toBe(false);
      expect(result.folderPath).toBeUndefined();
      expect(result.quest).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('VALID: {folder without quest.json} => skips folder, continues search', async () => {
      const proxy = questFolderFindBrokerProxy();
      const questsPath = FilePathStub({ value: '/project/.dungeonmaster-quests' });
      const quest = QuestStub({ id: 'add-auth', folder: '002-add-auth' });

      proxy.setupQuestFoldersWithMissingFile({
        questsPath,
        folders: [
          FolderNameStub({ value: '001-invalid' }),
          FolderNameStub({ value: '002-add-auth' }),
        ],
        missingFileFolder: FilePathStub({
          value: '/project/.dungeonmaster-quests/001-invalid/quest.json',
        }),
        validQuestFile: {
          folderPath: FilePathStub({ value: '/project/.dungeonmaster-quests/002-add-auth' }),
          questFilePath: FilePathStub({
            value: '/project/.dungeonmaster-quests/002-add-auth/quest.json',
          }),
          contents: FileContentsStub({ value: JSON.stringify(quest) }),
        },
      });

      const result = await questFolderFindBroker({ questId: 'add-auth', questsPath });

      expect(result.found).toBe(true);
      expect(result.folderPath).toBe('/project/.dungeonmaster-quests/002-add-auth');
    });
  });
});
