import { GuildIdStub } from '@dungeonmaster/shared/contracts/guild-id/guild-id.stub';
import { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';

import { QuestLoadResponderProxy } from './quest-load-responder.proxy';

describe('QuestLoadResponder', () => {
  describe('successful load', () => {
    it('VALID: {questId} => returns full quest object via find and load brokers', async () => {
      const quest = QuestStub();
      const guildId = GuildIdStub();
      const homePath = '/home/testuser/.dungeonmaster';
      const guildsDir = '/home/testuser/.dungeonmaster/guilds';
      const questsDirPath = `/home/testuser/.dungeonmaster/guilds/${guildId}/quests`;
      const questFolderPath = `/home/testuser/.dungeonmaster/guilds/${guildId}/quests/${quest.folder}`;
      const questFilePath = `/home/testuser/.dungeonmaster/guilds/${guildId}/quests/${quest.folder}/quest.json`;

      const proxy = QuestLoadResponderProxy();
      proxy.setupQuestFound({
        homeDir: '/home/testuser',
        homePath,
        guildsDir,
        guilds: [
          {
            dirName: guildId,
            questsDirPath,
            questFolders: [
              {
                folderName: quest.folder,
                questFilePath,
                questFolderPath,
                contents: JSON.stringify(quest),
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
