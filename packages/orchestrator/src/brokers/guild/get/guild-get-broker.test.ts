import { GuildConfigStub, GuildIdStub, GuildStub } from '@dungeonmaster/shared/contracts';

import { guildGetBroker } from './guild-get-broker';
import { guildGetBrokerProxy } from './guild-get-broker.proxy';

describe('guildGetBroker', () => {
  describe('successful retrieval', () => {
    it('VALID: {guildId exists} => returns guild', async () => {
      const proxy = guildGetBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const guild = GuildStub({
        id: guildId,
        name: 'My App',
        path: '/home/user/my-app',
        createdAt: '2024-01-15T10:00:00.000Z',
      });

      proxy.setupConfig({
        config: GuildConfigStub({ guilds: [guild] }),
      });

      const result = await guildGetBroker({ guildId });

      expect(result).toStrictEqual({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'My App',
        path: '/home/user/my-app',
        urlSlug: 'my-guild',
        createdAt: '2024-01-15T10:00:00.000Z',
      });
    });

    it('VALID: {guildId among multiple guilds} => returns matching guild', async () => {
      const proxy = guildGetBrokerProxy();
      const guildId = GuildIdStub({ value: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' });
      const guild1 = GuildStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'First Guild',
        path: '/home/user/first',
      });
      const guild2 = GuildStub({
        id: guildId,
        name: 'Second Guild',
        path: '/home/user/second',
        createdAt: '2024-02-20T12:00:00.000Z',
      });

      proxy.setupConfig({
        config: GuildConfigStub({ guilds: [guild1, guild2] }),
      });

      const result = await guildGetBroker({ guildId });

      expect(result).toStrictEqual({
        id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        name: 'Second Guild',
        path: '/home/user/second',
        urlSlug: 'my-guild',
        createdAt: '2024-02-20T12:00:00.000Z',
      });
    });
  });

  describe('url slug backfill', () => {
    it('VALID: {guild without urlSlug} => generates slug from name and returns guild with slug', async () => {
      const proxy = guildGetBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const guild = GuildStub({
        id: guildId,
        name: 'My Cool App',
        path: '/home/user/my-cool-app',
        urlSlug: undefined,
        createdAt: '2024-01-15T10:00:00.000Z',
      });

      proxy.setupConfig({
        config: GuildConfigStub({ guilds: [guild] }),
      });

      const result = await guildGetBroker({ guildId });

      expect(result).toStrictEqual({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'My Cool App',
        path: '/home/user/my-cool-app',
        urlSlug: 'my-cool-app',
        createdAt: '2024-01-15T10:00:00.000Z',
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {guildId not in config} => throws guild not found', async () => {
      const proxy = guildGetBrokerProxy();
      const guildId = GuildIdStub({ value: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' });

      proxy.setupConfig({
        config: GuildConfigStub({ guilds: [] }),
      });

      await expect(guildGetBroker({ guildId })).rejects.toThrow(
        /Guild not found: aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/u,
      );
    });

    it('ERROR: {guildId not matching any guild} => throws guild not found', async () => {
      const proxy = guildGetBrokerProxy();
      const guildId = GuildIdStub({ value: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' });
      const otherGuild = GuildStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'Other Guild',
        path: '/home/user/other',
      });

      proxy.setupConfig({
        config: GuildConfigStub({ guilds: [otherGuild] }),
      });

      await expect(guildGetBroker({ guildId })).rejects.toThrow(
        /Guild not found: aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/u,
      );
    });
  });
});
