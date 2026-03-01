import { GuildIdStub, GuildStub, GuildConfigStub } from '@dungeonmaster/shared/contracts';

import { GuildGetResponderProxy } from './guild-get-responder.proxy';

describe('GuildGetResponder', () => {
  describe('delegation to broker', () => {
    it('VALID: {guildId} => delegates to guildGetBroker and returns guild', async () => {
      const proxy = GuildGetResponderProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const guild = GuildStub({ id: guildId });
      proxy.setupConfig({
        config: GuildConfigStub({ guilds: [guild] }),
      });

      const result = await proxy.callResponder({ guildId });

      expect(result.id).toBe(guildId);
    });
  });
});
