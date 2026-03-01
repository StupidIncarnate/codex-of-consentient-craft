import {
  GuildIdStub,
  GuildNameStub,
  GuildStub,
  GuildConfigStub,
} from '@dungeonmaster/shared/contracts';

import { GuildUpdateResponderProxy } from './guild-update-responder.proxy';

describe('GuildUpdateResponder', () => {
  describe('delegation to broker', () => {
    it('VALID: {guildId, name} => delegates to guildUpdateBroker and returns updated guild', async () => {
      const proxy = GuildUpdateResponderProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const guild = GuildStub({ id: guildId });
      proxy.setupConfig({
        config: GuildConfigStub({ guilds: [guild] }),
      });

      const result = await proxy.callResponder({
        guildId,
        name: GuildNameStub({ value: 'Updated Name' }),
      });

      expect(result.id).toBe(guildId);
    });
  });
});
