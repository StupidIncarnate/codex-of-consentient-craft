import { GuildIdStub } from '@dungeonmaster/shared/contracts/guild-id/guild-id.stub';

import { questResolveQuestsPathBroker } from './quest-resolve-quests-path-broker';
import { questResolveQuestsPathBrokerProxy } from './quest-resolve-quests-path-broker.proxy';

describe('questResolveQuestsPathBroker', () => {
  describe('path resolution', () => {
    it('VALID: {guildId} => returns quests path for the guild', () => {
      const proxy = questResolveQuestsPathBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

      proxy.setupQuestsPath({
        homeDir: '/home/user',
        homePath: '/home/user/.dungeonmaster',
        questsPath: '/home/user/.dungeonmaster/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/quests',
      });

      const result = questResolveQuestsPathBroker({ guildId });

      expect(result.questsPath).toBe(
        '/home/user/.dungeonmaster/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/quests',
      );
    });

    it('VALID: {different guildId} => returns quests path for different guild', () => {
      const proxy = questResolveQuestsPathBrokerProxy();
      const guildId = GuildIdStub({ value: '7a33141f-192d-204d-847e-9918b4840d56' });

      proxy.setupQuestsPath({
        homeDir: '/home/other',
        homePath: '/home/other/.dungeonmaster',
        questsPath: '/home/other/.dungeonmaster/guilds/7a33141f-192d-204d-847e-9918b4840d56/quests',
      });

      const result = questResolveQuestsPathBroker({ guildId });

      expect(result.questsPath).toBe(
        '/home/other/.dungeonmaster/guilds/7a33141f-192d-204d-847e-9918b4840d56/quests',
      );
    });
  });
});
