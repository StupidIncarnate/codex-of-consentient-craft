import { GuildIdStub } from '@dungeonmaster/shared/contracts/guild-id/guild-id.stub';
import { GuildStub } from '@dungeonmaster/shared/contracts/guild/guild.stub';
import { HomeConfigStub } from '@dungeonmaster/shared/contracts/home-config/home-config.stub';

import { GuildRemoveResponderProxy } from './guild-remove-responder.proxy';

describe('GuildRemoveResponder', () => {
  describe('delegation to broker', () => {
    it('VALID: {guildId} => delegates to guildRemoveBroker and removes guild', async () => {
      const proxy = GuildRemoveResponderProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const guild = GuildStub({ id: guildId });
      proxy.setupConfig({
        config: HomeConfigStub({ guilds: [guild] }),
      });
      proxy.setupQuestList({ guildId, quests: [] });

      await expect(proxy.callResponder({ guildId })).resolves.toBe(undefined);
    });
  });
});
