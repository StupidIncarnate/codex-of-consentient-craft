import { GuildConfigStub } from '@dungeonmaster/shared/contracts/guild-config/guild-config.stub';
import { GuildStub } from '@dungeonmaster/shared/contracts/guild/guild.stub';

import { guildListBroker } from './guild-list-broker';
import { guildListBrokerProxy } from './guild-list-broker.proxy';

type ListProxy = ReturnType<typeof guildListBrokerProxy>;
type SetupParams = Parameters<ListProxy['setupGuildList']>[0];
type QuestDirEntries = SetupParams['guildEntries'][0]['questDirEntries'];

const createMockDirEntry = ({ isDir }: { isDir: boolean }): QuestDirEntries[0] => ({
  name: 'entry',
  kind: isDir ? 'directory' : 'file',
});

describe('guildListBroker', () => {
  describe('successful list', () => {
    it('VALID: {single guild, accessible, 2 quest dirs} => returns list item with valid true and questCount 2', async () => {
      const proxy = guildListBrokerProxy();
      const homePath = '/home/user/.dungeonmaster';
      const guild = GuildStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'My App',
        path: '/home/user/my-app',
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const questsDirPath =
        '/home/user/.dungeonmaster/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/quests';

      proxy.setupGuildList({
        config: GuildConfigStub({ guilds: [guild] }),
        homeDir: '/home/user',
        homePath,
        guildEntries: [
          {
            accessible: true,
            questsDirPath,
            questDirEntries: [
              createMockDirEntry({ isDir: true }),
              createMockDirEntry({ isDir: true }),
            ],
          },
        ],
      });

      const result = await guildListBroker();

      expect(result).toStrictEqual([
        {
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          name: 'My App',
          path: '/home/user/my-app',
          urlSlug: 'my-guild',
          createdAt: '2024-01-15T10:00:00.000Z',

          valid: true,
          questCount: 2,
        },
      ]);
    });

    it('VALID: {guild not accessible} => returns list item with valid false', async () => {
      const proxy = guildListBrokerProxy();
      const homePath = '/home/user/.dungeonmaster';
      const guild = GuildStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'Missing App',
        path: '/home/user/missing-app',
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const questsDirPath =
        '/home/user/.dungeonmaster/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/quests';

      proxy.setupGuildList({
        config: GuildConfigStub({ guilds: [guild] }),
        homeDir: '/home/user',
        homePath,
        guildEntries: [
          {
            accessible: false,
            questsDirPath,
            questDirEntries: [],
          },
        ],
      });

      const result = await guildListBroker();

      expect(result).toStrictEqual([
        {
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          name: 'Missing App',
          path: '/home/user/missing-app',
          urlSlug: 'my-guild',
          createdAt: '2024-01-15T10:00:00.000Z',

          valid: false,
          questCount: 0,
        },
      ]);
    });

    it('VALID: {multiple guilds} => returns list items for each guild', async () => {
      const proxy = guildListBrokerProxy();
      const homePath = '/home/user/.dungeonmaster';
      const guild1 = GuildStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'First App',
        path: '/home/user/first-app',
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const guild2 = GuildStub({
        id: 'a99ef0d8-6ae0-1972-9617-694d449a8242',
        name: 'Second App',
        path: '/home/user/second-app',
        createdAt: '2024-02-20T12:00:00.000Z',
      });
      const questsDirPath1 =
        '/home/user/.dungeonmaster/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/quests';
      const questsDirPath2 =
        '/home/user/.dungeonmaster/guilds/a99ef0d8-6ae0-1972-9617-694d449a8242/quests';

      proxy.setupGuildList({
        config: GuildConfigStub({ guilds: [guild1, guild2] }),
        homeDir: '/home/user',
        homePath,
        guildEntries: [
          {
            accessible: true,
            questsDirPath: questsDirPath1,
            questDirEntries: [createMockDirEntry({ isDir: true })],
          },
          {
            accessible: true,
            questsDirPath: questsDirPath2,
            questDirEntries: [
              createMockDirEntry({ isDir: true }),
              createMockDirEntry({ isDir: true }),
              createMockDirEntry({ isDir: true }),
            ],
          },
        ],
      });

      const result = await guildListBroker();

      expect(result).toStrictEqual([
        {
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          name: 'First App',
          path: '/home/user/first-app',
          urlSlug: 'my-guild',
          createdAt: '2024-01-15T10:00:00.000Z',

          valid: true,
          questCount: 1,
        },
        {
          id: 'a99ef0d8-6ae0-1972-9617-694d449a8242',
          name: 'Second App',
          path: '/home/user/second-app',
          urlSlug: 'my-guild',
          createdAt: '2024-02-20T12:00:00.000Z',

          valid: true,
          questCount: 3,
        },
      ]);
    });

    it('VALID: {one guild with relative path "jo" beside a good guild} => lists both, the bad one flagged valid false', async () => {
      const proxy = guildListBrokerProxy();
      const homePath = '/home/user/.dungeonmaster';
      const badGuild = GuildStub({
        id: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
        name: 'jod',
        path: 'jo',
        urlSlug: 'jod',
        createdAt: '2026-09-29T00:30:54.570Z',
      });
      const goodGuild = GuildStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'My App',
        path: '/home/user/my-app',
        urlSlug: 'my-app',
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const badQuestsDirPath =
        '/home/user/.dungeonmaster/guilds/aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee/quests';
      const goodQuestsDirPath =
        '/home/user/.dungeonmaster/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/quests';

      proxy.setupGuildList({
        config: GuildConfigStub({ guilds: [badGuild, goodGuild] }),
        homeDir: '/home/user',
        homePath,
        guildEntries: [
          {
            accessible: true,
            questsDirPath: badQuestsDirPath,
            questDirEntries: [],
          },
          {
            accessible: true,
            questsDirPath: goodQuestsDirPath,
            questDirEntries: [createMockDirEntry({ isDir: true })],
          },
        ],
      });

      const result = await guildListBroker();

      expect(result).toStrictEqual([
        {
          id: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
          name: 'jod',
          path: 'jo',
          urlSlug: 'jod',
          createdAt: '2026-09-29T00:30:54.570Z',

          valid: false,
          questCount: 0,
        },
        {
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          name: 'My App',
          path: '/home/user/my-app',
          urlSlug: 'my-app',
          createdAt: '2024-01-15T10:00:00.000Z',

          valid: true,
          questCount: 1,
        },
      ]);
    });

    it('VALID: {entries with non-directory files} => counts only directories as quests', async () => {
      const proxy = guildListBrokerProxy();
      const homePath = '/home/user/.dungeonmaster';
      const guild = GuildStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'My App',
        path: '/home/user/my-app',
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const questsDirPath =
        '/home/user/.dungeonmaster/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/quests';

      proxy.setupGuildList({
        config: GuildConfigStub({ guilds: [guild] }),
        homeDir: '/home/user',
        homePath,
        guildEntries: [
          {
            accessible: true,
            questsDirPath,
            questDirEntries: [
              createMockDirEntry({ isDir: true }),
              createMockDirEntry({ isDir: false }),
              createMockDirEntry({ isDir: true }),
            ],
          },
        ],
      });

      const result = await guildListBroker();

      expect(result).toStrictEqual([
        {
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          name: 'My App',
          path: '/home/user/my-app',
          urlSlug: 'my-guild',
          createdAt: '2024-01-15T10:00:00.000Z',

          valid: true,
          questCount: 2,
        },
      ]);
    });
  });

  describe('url slug backfill', () => {
    it('VALID: {guild without urlSlug} => generates slug from name and persists', async () => {
      const proxy = guildListBrokerProxy();
      const homePath = '/home/user/.dungeonmaster';
      const guild = GuildStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'My Cool App',
        path: '/home/user/my-cool-app',
        urlSlug: undefined,
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const questsDirPath =
        '/home/user/.dungeonmaster/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/quests';

      proxy.setupGuildList({
        config: GuildConfigStub({ guilds: [guild] }),
        homeDir: '/home/user',
        homePath,
        guildEntries: [
          {
            accessible: true,
            questsDirPath,
            questDirEntries: [],
          },
        ],
      });

      const result = await guildListBroker();

      expect(result).toStrictEqual([
        {
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          name: 'My Cool App',
          path: '/home/user/my-cool-app',
          urlSlug: 'my-cool-app',
          createdAt: '2024-01-15T10:00:00.000Z',

          valid: true,
          questCount: 0,
        },
      ]);
    });
  });

  describe('empty config', () => {
    it('EMPTY: {no guilds in config} => returns empty array', async () => {
      const proxy = guildListBrokerProxy();
      const homePath = '/home/user/.dungeonmaster';

      proxy.setupEmptyConfig({ homeDir: '/home/user', homePath });

      const result = await guildListBroker();

      expect(result).toStrictEqual([]);
    });
  });
});
