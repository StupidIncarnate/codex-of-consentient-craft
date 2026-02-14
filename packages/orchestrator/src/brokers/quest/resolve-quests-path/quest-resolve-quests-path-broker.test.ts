import { FilePathStub, GuildIdStub } from '@dungeonmaster/shared/contracts';

import { questResolveQuestsPathBroker } from './quest-resolve-quests-path-broker';
import { questResolveQuestsPathBrokerProxy } from './quest-resolve-quests-path-broker.proxy';

describe('questResolveQuestsPathBroker', () => {
  describe('path resolution', () => {
    it('VALID: {guildId} => returns quests path for the guild', () => {
      const proxy = questResolveQuestsPathBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

      proxy.setupQuestsPath({
        homeDir: '/home/user',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
        questsPath: FilePathStub({
          value: '/home/user/.dungeonmaster/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/quests',
        }),
      });

      const result = questResolveQuestsPathBroker({ guildId });

      expect(result.questsPath).toBe(
        '/home/user/.dungeonmaster/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/quests',
      );
    });

    it('VALID: {different guildId} => returns quests path for different guild', () => {
      const proxy = questResolveQuestsPathBrokerProxy();
      const guildId = GuildIdStub({ value: '12345678-1234-1234-1234-123456789abc' });

      proxy.setupQuestsPath({
        homeDir: '/home/other',
        homePath: FilePathStub({ value: '/home/other/.dungeonmaster' }),
        questsPath: FilePathStub({
          value: '/home/other/.dungeonmaster/guilds/12345678-1234-1234-1234-123456789abc/quests',
        }),
      });

      const result = questResolveQuestsPathBroker({ guildId });

      expect(result.questsPath).toBe(
        '/home/other/.dungeonmaster/guilds/12345678-1234-1234-1234-123456789abc/quests',
      );
    });
  });
});
