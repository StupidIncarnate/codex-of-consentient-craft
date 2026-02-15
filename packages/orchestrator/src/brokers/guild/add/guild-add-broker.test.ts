import {
  FilePathStub,
  GuildConfigStub,
  GuildNameStub,
  GuildPathStub,
  GuildStub,
} from '@dungeonmaster/shared/contracts';

import { guildAddBroker } from './guild-add-broker';
import { guildAddBrokerProxy } from './guild-add-broker.proxy';

describe('guildAddBroker', () => {
  describe('successful add', () => {
    it('VALID: {name, path, empty config} => returns new guild with generated id and createdAt', async () => {
      const proxy = guildAddBrokerProxy();
      const name = GuildNameStub({ value: 'My App' });
      const path = GuildPathStub({ value: '/home/user/my-app' });
      const homePath = FilePathStub({ value: '/home/user/.dungeonmaster' });
      const guildsPath = FilePathStub({ value: '/home/user/.dungeonmaster/guilds' });
      const guildDirPath = FilePathStub({
        value: '/home/user/.dungeonmaster/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479',
      });
      const questsDirPath = FilePathStub({
        value: '/home/user/.dungeonmaster/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/quests',
      });

      proxy.setupAddGuild({
        existingConfig: GuildConfigStub({ guilds: [] }),
        homeDir: '/home/user',
        homePath,
        guildsPath,
        guildDirPath,
        questsDirPath,
      });

      const result = await guildAddBroker({ name, path });

      expect(result).toStrictEqual({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'My App',
        path: '/home/user/my-app',
        urlSlug: 'my-app',
        createdAt: '2024-01-15T10:00:00.000Z',
        chatSessions: [],
      });
    });

    it('VALID: {name, path, config with existing guilds} => returns new guild alongside existing', async () => {
      const proxy = guildAddBrokerProxy();
      const name = GuildNameStub({ value: 'Second App' });
      const path = GuildPathStub({ value: '/home/user/second-app' });
      const homePath = FilePathStub({ value: '/home/user/.dungeonmaster' });
      const guildsPath = FilePathStub({ value: '/home/user/.dungeonmaster/guilds' });
      const guildDirPath = FilePathStub({
        value: '/home/user/.dungeonmaster/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479',
      });
      const questsDirPath = FilePathStub({
        value: '/home/user/.dungeonmaster/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/quests',
      });

      const existingGuild = GuildStub({
        id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        name: 'First App',
        path: '/home/user/first-app',
      });

      proxy.setupAddGuild({
        existingConfig: GuildConfigStub({ guilds: [existingGuild] }),
        homeDir: '/home/user',
        homePath,
        guildsPath,
        guildDirPath,
        questsDirPath,
      });

      const result = await guildAddBroker({ name, path });

      expect(result).toStrictEqual({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'Second App',
        path: '/home/user/second-app',
        urlSlug: 'second-app',
        createdAt: '2024-01-15T10:00:00.000Z',
        chatSessions: [],
      });
    });
  });

  describe('duplicate path', () => {
    it('ERROR: {path already exists in config} => throws duplicate path error', async () => {
      const proxy = guildAddBrokerProxy();
      const name = GuildNameStub({ value: 'Duplicate App' });
      const path = GuildPathStub({ value: '/home/user/my-app' });

      const existingGuild = GuildStub({
        id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        name: 'Existing App',
        path: '/home/user/my-app',
      });

      proxy.setupDuplicatePath({
        existingConfig: GuildConfigStub({ guilds: [existingGuild] }),
      });

      await expect(guildAddBroker({ name, path })).rejects.toThrow(
        /A guild with path \/home\/user\/my-app already exists/u,
      );
    });
  });
});
