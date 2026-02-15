import { GuildIdStub, GuildStub } from '@dungeonmaster/shared/contracts';

import { guildDetailBroker } from './guild-detail-broker';
import { guildDetailBrokerProxy } from './guild-detail-broker.proxy';

describe('guildDetailBroker', () => {
  describe('successful fetch', () => {
    it('VALID: {guildId} => returns guild', async () => {
      const proxy = guildDetailBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const guild = GuildStub({ id: guildId });

      proxy.setupGuild({ guild });

      const result = await guildDetailBroker({ guildId });

      expect(result).toStrictEqual(guild);
    });
  });

  describe('error handling', () => {
    it('ERROR: {server error} => throws error', async () => {
      const proxy = guildDetailBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

      proxy.setupError();

      await expect(guildDetailBroker({ guildId })).rejects.toThrow(/fetch/iu);
    });
  });
});
