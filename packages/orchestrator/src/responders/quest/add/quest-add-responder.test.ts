import { FilePathStub, GuildIdStub } from '@dungeonmaster/shared/contracts';

import { QuestAddResponderProxy } from './quest-add-responder.proxy';

describe('QuestAddResponder', () => {
  describe('successful quest creation', () => {
    it('VALID: {title, userRequest, guildId} => returns success result from broker', async () => {
      const guildId = GuildIdStub();
      const questsFolderPath = FilePathStub({
        value: '/home/testuser/.dungeonmaster/guilds/guild-1/quests',
      });
      const questFolderPath = FilePathStub({
        value: '/home/testuser/.dungeonmaster/guilds/guild-1/quests/quest-1',
      });
      const questFilePath = FilePathStub({
        value: '/home/testuser/.dungeonmaster/guilds/guild-1/quests/quest-1/quest.json',
      });
      const proxy = QuestAddResponderProxy();
      proxy.setupQuestCreation({ questsFolderPath, questFolderPath, questFilePath });

      const result = await proxy.callResponder({
        title: 'Test Quest',
        userRequest: 'User wants to test',
        guildId,
      });

      expect(result.success).toBe(true);
    });

    it('VALID: {title, userRequest, guildId} => emits quest-created event on success', async () => {
      const guildId = GuildIdStub();
      const questsFolderPath = FilePathStub({
        value: '/home/testuser/.dungeonmaster/guilds/guild-1/quests',
      });
      const questFolderPath = FilePathStub({
        value: '/home/testuser/.dungeonmaster/guilds/guild-1/quests/quest-1',
      });
      const questFilePath = FilePathStub({
        value: '/home/testuser/.dungeonmaster/guilds/guild-1/quests/quest-1/quest.json',
      });
      const proxy = QuestAddResponderProxy();
      const eventCapture = proxy.setupEventCapture();
      proxy.setupQuestCreation({ questsFolderPath, questFolderPath, questFilePath });

      await proxy.callResponder({
        title: 'Test Quest',
        userRequest: 'User wants to test',
        guildId,
      });

      const emittedEvents = eventCapture.getEmittedEvents();

      expect(emittedEvents).toHaveLength(1);
      expect(emittedEvents[0]!.type).toBe('quest-created');
    });
  });

  describe('failed quest creation', () => {
    it('ERROR: {broker failure} => returns failure result without emitting event', async () => {
      const guildId = GuildIdStub();
      const questsFolderPath = FilePathStub({
        value: '/home/testuser/.dungeonmaster/guilds/guild-1/quests',
      });
      const proxy = QuestAddResponderProxy();
      const eventCapture = proxy.setupEventCapture();
      proxy.setupQuestCreationFailure({ questsFolderPath, error: new Error('disk full') });

      const result = await proxy.callResponder({
        title: 'Test Quest',
        userRequest: 'User wants to test',
        guildId,
      });

      expect(result.success).toBe(false);
      expect(eventCapture.getEmittedEvents()).toStrictEqual([]);
    });
  });
});
