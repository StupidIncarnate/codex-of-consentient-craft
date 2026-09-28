import {
  FileContentsStub,
  FileNameStub,
  FilePathStub,
  GuildIdStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

import { QuestLoadResponderProxy } from './quest-load-responder.proxy';

describe('QuestLoadResponder', () => {
  describe('successful load', () => {
    it('VALID: {questId} => returns full quest object via find and load brokers', async () => {
      const quest = QuestStub();
      const guildId = GuildIdStub();
      const homePath = FilePathStub({ value: '/home/testuser/.dungeonmaster' });
      const guildsDir = FilePathStub({ value: '/home/testuser/.dungeonmaster/guilds' });
      const questsDirPath = FilePathStub({
        value: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests`,
      });
      const questFolderPath = FilePathStub({
        value: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests/${quest.folder}`,
      });
      const questFilePath = FilePathStub({
        value: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests/${quest.folder}/quest.json`,
      });

      const proxy = QuestLoadResponderProxy();
      proxy.setupQuestFound({
        homeDir: '/home/testuser',
        homePath,
        guildsDir,
        guilds: [
          {
            dirName: FileNameStub({ value: guildId }),
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
      proxy.setupQuestFileJoin({ questPath: questFolderPath, questFilePath });
      proxy.setupQuestFile({ questJson: JSON.stringify(quest) });

      const result = await proxy.callResponder({ questId: quest.id });

      const { id, title } = result;

      expect(id).toBe(quest.id);
      expect(title).toBe(quest.title);
      // Pins the exact tuple this responder's OWN join call is addressed by — a wrong second
      // segment would still resolve via questFindQuestPathBroker's own real-passthrough default
      // and read the right quest file for the wrong reason (see the "passthrough join composed
      // from far away" trap).
      expect(proxy.getQuestFileJoinArgs({ questPath: questFolderPath })).toStrictEqual([
        [questFolderPath, 'quest.json'],
      ]);
    });
  });
});
