import { GuildListItemStub } from '@dungeonmaster/shared/contracts';

import { guildListBroker } from './guild-list-broker';
import { guildListBrokerProxy } from './guild-list-broker.proxy';

describe('guildListBroker', () => {
  describe('successful fetch', () => {
    it('VALID: {} => returns guild list from API', async () => {
      const proxy = guildListBrokerProxy();
      const guilds = [
        GuildListItemStub({ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', name: 'First Guild' }),
        GuildListItemStub({ id: 'a1b2c3d4-5678-9abc-def0-123456789abc', name: 'Second Guild' }),
      ];

      proxy.setupGuilds({ guilds });

      const result = await guildListBroker();

      expect(result).toStrictEqual(guilds);
    });
  });

  describe('empty list', () => {
    it('EMPTY: {} => returns empty array', async () => {
      const proxy = guildListBrokerProxy();

      proxy.setupGuilds({ guilds: [] });

      const result = await guildListBroker();

      expect(result).toStrictEqual([]);
    });
  });

  describe('error handling', () => {
    it('ERROR: {network failure} => throws error', async () => {
      const proxy = guildListBrokerProxy();

      proxy.setupError();

      await expect(guildListBroker()).rejects.toThrow(/fetch/iu);
    });
  });

  describe('zod validation', () => {
    it('ERROR: {fetch returns invalid shape} => throws ZodError', async () => {
      const proxy = guildListBrokerProxy();

      proxy.setupInvalidResponse({ data: [{ bad: 'data' }] });

      await expect(guildListBroker()).rejects.toThrow(/invalid_type/u);
    });
  });
});
