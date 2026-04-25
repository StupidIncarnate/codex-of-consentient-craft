import { FilePathStub, GuildIdStub } from '@dungeonmaster/shared/contracts';

import { QuestUserAddResponderProxy } from './quest-user-add-responder.proxy';

describe('QuestUserAddResponder', () => {
  describe('successful quest creation', () => {
    it('VALID: {title, userRequest, guildId} => returns success result from broker', async () => {
      const guildId = GuildIdStub();
      const questFolderPath = FilePathStub({
        value: '/home/testuser/.dungeonmaster/guilds/guild-1/quests/quest-1',
      });
      const questFilePath = FilePathStub({
        value: '/home/testuser/.dungeonmaster/guilds/guild-1/quests/quest-1/quest.json',
      });
      const proxy = QuestUserAddResponderProxy();
      proxy.setupQuestCreation({ questFolderPath, questFilePath });

      const result = await proxy.callResponder({
        title: 'Test Quest',
        userRequest: 'User wants to test',
        guildId,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('failed quest creation', () => {
    it('ERROR: {broker failure} => returns failure result', async () => {
      const guildId = GuildIdStub();
      const proxy = QuestUserAddResponderProxy();
      proxy.setupCreateFailure({ error: new Error('disk full') });

      const result = await proxy.callResponder({
        title: 'Test Quest',
        userRequest: 'User wants to test',
        guildId,
      });

      expect(result.success).toBe(false);
    });
  });
});
