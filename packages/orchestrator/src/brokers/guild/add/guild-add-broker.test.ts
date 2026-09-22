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

  describe('caller-supplied id', () => {
    it('VALID: {name, path, id} => returns guild carrying exactly the supplied id', async () => {
      const proxy = guildAddBrokerProxy();
      const name = GuildNameStub({ value: 'Pinned App' });
      const path = GuildPathStub({ value: '/home/user/pinned-app' });
      const suppliedId = '11111111-1111-1111-1111-111111111111';
      const homePath = FilePathStub({ value: '/home/user/.dungeonmaster' });
      const guildsPath = FilePathStub({ value: '/home/user/.dungeonmaster/guilds' });
      const guildDirPath = FilePathStub({
        value: `/home/user/.dungeonmaster/guilds/${suppliedId}`,
      });
      const questsDirPath = FilePathStub({
        value: `/home/user/.dungeonmaster/guilds/${suppliedId}/quests`,
      });

      proxy.setupAddGuild({
        existingConfig: GuildConfigStub({ guilds: [] }),
        homeDir: '/home/user',
        homePath,
        guildsPath,
        guildDirPath,
        questsDirPath,
      });

      const result = await guildAddBroker({ name, path, id: suppliedId });

      expect(result).toStrictEqual({
        id: suppliedId,
        name: 'Pinned App',
        path: '/home/user/pinned-app',
        urlSlug: 'pinned-app',
        createdAt: '2024-01-15T10:00:00.000Z',
      });
    });

    it("INVALID: {id: 'not-a-uuid'} => throws guildIdContract's own validation error", async () => {
      const proxy = guildAddBrokerProxy();
      const name = GuildNameStub({ value: 'Bad Id App' });
      const path = GuildPathStub({ value: '/home/user/bad-id-app' });
      const homePath = FilePathStub({ value: '/home/user/.dungeonmaster' });
      const guildsPath = FilePathStub({ value: '/home/user/.dungeonmaster/guilds' });

      proxy.setupAddGuild({
        existingConfig: GuildConfigStub({ guilds: [] }),
        homeDir: '/home/user',
        homePath,
        guildsPath,
        guildDirPath: FilePathStub({ value: '/home/user/.dungeonmaster/guilds/unused' }),
        questsDirPath: FilePathStub({
          value: '/home/user/.dungeonmaster/guilds/unused/quests',
        }),
      });

      await expect(guildAddBroker({ name, path, id: 'not-a-uuid' })).rejects.toThrow(
        /Invalid uuid/u,
      );
    });
  });

  describe('caller-supplied home', () => {
    it('VALID: {home} => the only directory it makes is the quests dir under that home', async () => {
      const proxy = guildAddBrokerProxy();

      proxy.setupAddGuildInSuppliedHome({
        existingConfig: GuildConfigStub({ guilds: [] }),
        configFilePath: FilePathStub({ value: '/tmp/dm-home-target/config.json' }),
      });

      await guildAddBroker({
        name: GuildNameStub({ value: 'Targeted App' }),
        path: GuildPathStub({ value: '/tmp/dm-home-target/targeted-app' }),
        home: '/tmp/dm-home-target',
      });

      expect(proxy.dirsCreated()).toStrictEqual([
        '/tmp/dm-home-target/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/quests',
      ]);
    });

    it('VALID: {home} => the only config file it writes is the one under that home', async () => {
      const proxy = guildAddBrokerProxy();

      proxy.setupAddGuildInSuppliedHome({
        existingConfig: GuildConfigStub({ guilds: [] }),
        configFilePath: FilePathStub({ value: '/tmp/dm-home-target/config.json' }),
      });

      await guildAddBroker({
        name: GuildNameStub({ value: 'Targeted App' }),
        path: GuildPathStub({ value: '/tmp/dm-home-target/targeted-app' }),
        home: '/tmp/dm-home-target',
      });

      expect(proxy.configFilesWritten()).toStrictEqual(['/tmp/dm-home-target/config.json']);
    });

    it('VALID: {home} => returns the guild registered against that home', async () => {
      const proxy = guildAddBrokerProxy();

      proxy.setupAddGuildInSuppliedHome({
        existingConfig: GuildConfigStub({ guilds: [] }),
        configFilePath: FilePathStub({ value: '/tmp/dm-home-target/config.json' }),
      });

      const result = await guildAddBroker({
        name: GuildNameStub({ value: 'Targeted App' }),
        path: GuildPathStub({ value: '/tmp/dm-home-target/targeted-app' }),
        home: '/tmp/dm-home-target',
      });

      expect(result).toStrictEqual({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'Targeted App',
        path: '/tmp/dm-home-target/targeted-app',
        urlSlug: 'targeted-app',
        createdAt: '2024-01-15T10:00:00.000Z',
      });
    });

    it("INVALID: {home: 'relative/dm-home'} => throws absoluteFilePathContract's own validation error", async () => {
      guildAddBrokerProxy();

      await expect(
        guildAddBroker({
          name: GuildNameStub({ value: 'Relative Home App' }),
          path: GuildPathStub({ value: '/tmp/dm-home-target/relative-home-app' }),
          home: 'relative/dm-home',
        }),
      ).rejects.toThrow(/Path must be absolute/u);
    });

    // `filePathContract` is a UNION whose error still carries the absolute branch's message, so a
    // bare 'relative/dm-home' is refused by both contracts and cannot tell them apart. '../dm-home'
    // can: the union accepts a '../'-prefixed path, and every path joined off it stays '../'-
    // prefixed and so stays acceptable, which is how a home validated as any-file-path reaches the
    // filesystem resolving against `process.cwd()` instead of throwing here.
    it("INVALID: {home: '../dm-home'} => throws rather than resolving against the process cwd", async () => {
      guildAddBrokerProxy();

      await expect(
        guildAddBroker({
          name: GuildNameStub({ value: 'Parent Relative Home App' }),
          path: GuildPathStub({ value: '/tmp/dm-home-target/parent-relative-home-app' }),
          home: '../dm-home',
        }),
      ).rejects.toThrow(/Path must be absolute/u);
    });
  });

  // The counterpart to the supplied-home cases above: with no home, every one of the same three
  // paths resolves through dungeonmasterHomeEnsureBroker instead, which is the call that reads
  // DUNGEONMASTER_HOME. The two path lists never overlap, so a broker ignoring a supplied home
  // produces this list where the one above is asserted.
  describe('no supplied home', () => {
    it('VALID: {name, path} => makes the default home, its guilds dir and the quests dir under it', async () => {
      const proxy = guildAddBrokerProxy();
      const homePath = FilePathStub({ value: '/home/user/.dungeonmaster' });
      const guildsPath = FilePathStub({ value: '/home/user/.dungeonmaster/guilds' });
      const questsDirPath = FilePathStub({
        value: '/home/user/.dungeonmaster/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/quests',
      });

      proxy.setupAddGuild({
        existingConfig: GuildConfigStub({ guilds: [] }),
        homeDir: '/home/user',
        homePath,
        guildsPath,
        guildDirPath: FilePathStub({
          value: '/home/user/.dungeonmaster/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479',
        }),
        questsDirPath,
      });

      await guildAddBroker({
        name: GuildNameStub({ value: 'Default Home App' }),
        path: GuildPathStub({ value: '/home/user/default-home-app' }),
      });

      expect(proxy.dirsCreated()).toStrictEqual([
        '/home/user/.dungeonmaster',
        '/home/user/.dungeonmaster/guilds',
        '/home/user/.dungeonmaster/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/quests',
      ]);
    });

    it('VALID: {name, path} => writes the config file under the default home', async () => {
      const proxy = guildAddBrokerProxy();

      proxy.setupAddGuild({
        existingConfig: GuildConfigStub({ guilds: [] }),
        homeDir: '/home/user',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
        guildsPath: FilePathStub({ value: '/home/user/.dungeonmaster/guilds' }),
        guildDirPath: FilePathStub({
          value: '/home/user/.dungeonmaster/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479',
        }),
        questsDirPath: FilePathStub({
          value: '/home/user/.dungeonmaster/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/quests',
        }),
      });

      await guildAddBroker({
        name: GuildNameStub({ value: 'Default Home App' }),
        path: GuildPathStub({ value: '/home/user/default-home-app' }),
      });

      expect(proxy.configFilesWritten()).toStrictEqual(['/home/user/.dungeonmaster/config.json']);
    });
  });

  describe('no supplied id', () => {
    it('VALID: {name, path, two calls, no id} => mints a different valid id each call', async () => {
      const proxy = guildAddBrokerProxy();
      const homePath = FilePathStub({ value: '/home/user/.dungeonmaster' });
      const guildsPath = FilePathStub({ value: '/home/user/.dungeonmaster/guilds' });
      const firstId = 'aaaaaaaa-1111-1111-1111-111111111111';
      const secondId = 'bbbbbbbb-2222-2222-2222-222222222222';

      proxy.setupAddGuild({
        existingConfig: GuildConfigStub({ guilds: [] }),
        homeDir: '/home/user',
        homePath,
        guildsPath,
        guildDirPath: FilePathStub({ value: `/home/user/.dungeonmaster/guilds/${firstId}` }),
        questsDirPath: FilePathStub({
          value: `/home/user/.dungeonmaster/guilds/${firstId}/quests`,
        }),
      });
      proxy.stageGeneratedId({ id: firstId });

      const firstResult = await guildAddBroker({
        name: GuildNameStub({ value: 'App One' }),
        path: GuildPathStub({ value: '/home/user/app-one' }),
      });

      proxy.setupAddGuild({
        existingConfig: GuildConfigStub({ guilds: [] }),
        homeDir: '/home/user',
        homePath,
        guildsPath,
        guildDirPath: FilePathStub({ value: `/home/user/.dungeonmaster/guilds/${secondId}` }),
        questsDirPath: FilePathStub({
          value: `/home/user/.dungeonmaster/guilds/${secondId}/quests`,
        }),
      });
      proxy.stageGeneratedId({ id: secondId });

      const secondResult = await guildAddBroker({
        name: GuildNameStub({ value: 'App Two' }),
        path: GuildPathStub({ value: '/home/user/app-two' }),
      });

      expect(firstResult.id).toBe(firstId);
      expect(secondResult.id).toBe(secondId);
    });
  });
});
