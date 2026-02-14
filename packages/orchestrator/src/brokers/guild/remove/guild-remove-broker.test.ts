import { GuildConfigStub, GuildIdStub, GuildStub } from '@dungeonmaster/shared/contracts';

import { guildRemoveBroker } from './guild-remove-broker';
import { guildRemoveBrokerProxy } from './guild-remove-broker.proxy';

describe('guildRemoveBroker', () => {
  describe('successful removal', () => {
    it('VALID: {guildId exists in config} => removes guild without error', async () => {
      const proxy = guildRemoveBrokerProxy();
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

      await expect(guildRemoveBroker({ guildId })).resolves.toBeUndefined();
    });

    it('VALID: {guildId among multiple guilds} => removes only matching guild', async () => {
      const proxy = guildRemoveBrokerProxy();
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
      });

      proxy.setupConfig({
        config: GuildConfigStub({ guilds: [guild1, guild2] }),
      });

      await expect(guildRemoveBroker({ guildId })).resolves.toBeUndefined();
    });
  });

  describe('error cases', () => {
    it('ERROR: {guildId not in config} => throws guild not found', async () => {
      const proxy = guildRemoveBrokerProxy();
      const guildId = GuildIdStub({ value: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' });

      proxy.setupConfig({
        config: GuildConfigStub({ guilds: [] }),
      });

      await expect(guildRemoveBroker({ guildId })).rejects.toThrow(
        /Guild not found: aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/u,
      );
    });

    it('ERROR: {guildId not matching any guild} => throws guild not found', async () => {
      const proxy = guildRemoveBrokerProxy();
      const guildId = GuildIdStub({ value: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' });
      const otherGuild = GuildStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'Other Guild',
        path: '/home/user/other',
      });

      proxy.setupConfig({
        config: GuildConfigStub({ guilds: [otherGuild] }),
      });

      await expect(guildRemoveBroker({ guildId })).rejects.toThrow(
        /Guild not found: aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/u,
      );
    });
  });
});
