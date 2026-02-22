import { FilePathStub, GuildConfigStub, GuildStub } from '@dungeonmaster/shared/contracts';

import { guildConfigReadBroker } from './guild-config-read-broker';
import { guildConfigReadBrokerProxy } from './guild-config-read-broker.proxy';

describe('guildConfigReadBroker', () => {
  describe('existing config', () => {
    it('VALID: {config.json exists with guilds} => returns parsed GuildConfig', async () => {
      const proxy = guildConfigReadBrokerProxy();
      const homePath = FilePathStub({ value: '/home/user/.dungeonmaster' });
      const configFilePath = FilePathStub({ value: '/home/user/.dungeonmaster/config.json' });
      const guild = GuildStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'My Guild',
        path: '/home/user/my-guild',
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const config = GuildConfigStub({ guilds: [guild] });
      const configJson = JSON.stringify(config);

      proxy.setupConfigExists({
        homeDir: '/home/user',
        homePath,
        configFilePath,
        configJson,
      });

      const result = await guildConfigReadBroker();

      expect(result).toStrictEqual({
        guilds: [
          {
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            name: 'My Guild',
            path: '/home/user/my-guild',
            urlSlug: 'my-guild',
            createdAt: '2024-01-15T10:00:00.000Z',
          },
        ],
      });
    });

    it('VALID: {config.json exists with empty guilds} => returns config with empty array', async () => {
      const proxy = guildConfigReadBrokerProxy();
      const homePath = FilePathStub({ value: '/home/user/.dungeonmaster' });
      const configFilePath = FilePathStub({ value: '/home/user/.dungeonmaster/config.json' });
      const configJson = JSON.stringify({ guilds: [] });

      proxy.setupConfigExists({
        homeDir: '/home/user',
        homePath,
        configFilePath,
        configJson,
      });

      const result = await guildConfigReadBroker();

      expect(result).toStrictEqual({
        guilds: [],
      });
    });
  });

  describe('missing config', () => {
    it('EMPTY: {config.json does not exist} => returns default config with empty guilds', async () => {
      const proxy = guildConfigReadBrokerProxy();
      const homePath = FilePathStub({ value: '/home/user/.dungeonmaster' });
      const configFilePath = FilePathStub({ value: '/home/user/.dungeonmaster/config.json' });

      proxy.setupConfigMissing({
        homeDir: '/home/user',
        homePath,
        configFilePath,
      });

      const result = await guildConfigReadBroker();

      expect(result).toStrictEqual({
        guilds: [],
      });
    });
  });

  describe('read errors', () => {
    it('ERROR: {non-ENOENT read failure} => throws error', async () => {
      const proxy = guildConfigReadBrokerProxy();
      const homePath = FilePathStub({ value: '/home/user/.dungeonmaster' });
      const configFilePath = FilePathStub({ value: '/home/user/.dungeonmaster/config.json' });

      proxy.setupReadError({
        homeDir: '/home/user',
        homePath,
        configFilePath,
        error: new Error('Permission denied'),
      });

      await expect(guildConfigReadBroker()).rejects.toThrow(/Failed to read file/u);
    });
  });
});
