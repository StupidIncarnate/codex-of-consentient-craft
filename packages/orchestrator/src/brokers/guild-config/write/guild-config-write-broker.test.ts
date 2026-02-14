import { FilePathStub, GuildConfigStub, GuildStub } from '@dungeonmaster/shared/contracts';

import { guildConfigWriteBroker } from './guild-config-write-broker';
import { guildConfigWriteBrokerProxy } from './guild-config-write-broker.proxy';

describe('guildConfigWriteBroker', () => {
  describe('successful write', () => {
    it('VALID: {config with guilds} => writes pretty-printed JSON', async () => {
      const proxy = guildConfigWriteBrokerProxy();
      const homePath = FilePathStub({ value: '/home/user/.dungeonmaster' });
      const configFilePath = FilePathStub({ value: '/home/user/.dungeonmaster/config.json' });
      const guild = GuildStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'My Guild',
        path: '/home/user/my-guild',
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const config = GuildConfigStub({ guilds: [guild] });

      proxy.setupWriteSuccess({
        homeDir: '/home/user',
        homePath,
        configFilePath,
      });

      await guildConfigWriteBroker({ config });

      const writtenContent = proxy.getWrittenContent();

      expect(writtenContent).toBe(JSON.stringify(config, null, 2));
    });

    it('VALID: {config with empty guilds} => writes JSON with empty array', async () => {
      const proxy = guildConfigWriteBrokerProxy();
      const homePath = FilePathStub({ value: '/home/user/.dungeonmaster' });
      const configFilePath = FilePathStub({ value: '/home/user/.dungeonmaster/config.json' });
      const config = GuildConfigStub({ guilds: [] });

      proxy.setupWriteSuccess({
        homeDir: '/home/user',
        homePath,
        configFilePath,
      });

      await guildConfigWriteBroker({ config });

      const writtenContent = proxy.getWrittenContent();

      expect(writtenContent).toBe(JSON.stringify({ guilds: [] }, null, 2));
    });
  });

  describe('write errors', () => {
    it('ERROR: {write failure} => throws error', async () => {
      const proxy = guildConfigWriteBrokerProxy();
      const homePath = FilePathStub({ value: '/home/user/.dungeonmaster' });
      const configFilePath = FilePathStub({ value: '/home/user/.dungeonmaster/config.json' });
      const config = GuildConfigStub({ guilds: [] });

      proxy.setupWriteFailure({
        homeDir: '/home/user',
        homePath,
        configFilePath,
        error: new Error('EACCES: permission denied'),
      });

      await expect(guildConfigWriteBroker({ config })).rejects.toThrow(
        /EACCES: permission denied/u,
      );
    });
  });
});
