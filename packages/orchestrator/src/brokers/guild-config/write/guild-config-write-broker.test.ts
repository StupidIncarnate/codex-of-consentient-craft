import {
  AbsoluteFilePathStub,
  FilePathStub,
  GuildConfigStub,
  GuildStub,
} from '@dungeonmaster/shared/contracts';

import { guildConfigWriteBroker } from './guild-config-write-broker';
import { guildConfigWriteBrokerProxy } from './guild-config-write-broker.proxy';

describe('guildConfigWriteBroker', () => {
  // With a home supplied, nothing stages dungeonmasterHomeFindBroker and nothing stages a joined
  // path — the write address IS '<supplied home>/config.json', computed for real. The path list
  // is the observation: a broker resolving the process-wide home would name a different file
  // there, so this assertion cannot pass under both resolutions.
  describe('caller-supplied home', () => {
    it('VALID: {home: /tmp/dm-home-target} => writes exactly one file, under that home', async () => {
      const proxy = guildConfigWriteBrokerProxy();
      const config = GuildConfigStub({ guilds: [] });

      proxy.setupSuccessAt({
        configFilePath: FilePathStub({ value: '/tmp/dm-home-target/config.json' }),
      });

      await guildConfigWriteBroker({
        config,
        home: AbsoluteFilePathStub({ value: '/tmp/dm-home-target' }),
      });

      expect(proxy.configFilesWritten()).toStrictEqual(['/tmp/dm-home-target/config.json']);
    });

    it('VALID: {home: /tmp/dm-home-target} => writes the pretty-printed config to that file', async () => {
      const proxy = guildConfigWriteBrokerProxy();
      const guild = GuildStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'Targeted Guild',
        path: '/tmp/dm-home-target/targeted-guild',
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const config = GuildConfigStub({ guilds: [guild] });

      proxy.setupSuccessAt({
        configFilePath: FilePathStub({ value: '/tmp/dm-home-target/config.json' }),
      });

      await guildConfigWriteBroker({
        config,
        home: AbsoluteFilePathStub({ value: '/tmp/dm-home-target' }),
      });

      expect(
        proxy.getWrittenAt({
          configFilePath: FilePathStub({ value: '/tmp/dm-home-target/config.json' }),
        }),
      ).toBe(JSON.stringify(config, null, 2));
    });
  });

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
