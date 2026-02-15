import { FilePathStub, GuildConfigStub, GuildStub } from '@dungeonmaster/shared/contracts';

import { guildListBroker } from './guild-list-broker';
import { guildListBrokerProxy } from './guild-list-broker.proxy';

type ListProxy = ReturnType<typeof guildListBrokerProxy>;
type SetupParams = Parameters<ListProxy['setupGuildList']>[0];
type QuestDirEntries = SetupParams['guildEntries'][0]['questDirEntries'];

const createMockDirent = ({ isDir }: { isDir: boolean }): QuestDirEntries[0] =>
  ({
    isDirectory: jest.fn().mockReturnValue(isDir),
  }) as never;

describe('guildListBroker', () => {
  describe('successful list', () => {
    it('VALID: {single guild, accessible, 2 quest dirs} => returns list item with valid true and questCount 2', async () => {
      const proxy = guildListBrokerProxy();
      const homePath = FilePathStub({ value: '/home/user/.dungeonmaster' });
      const guild = GuildStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'My App',
        path: '/home/user/my-app',
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const questsDirPath = FilePathStub({
        value: '/home/user/.dungeonmaster/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/quests',
      });

      proxy.setupGuildList({
        config: GuildConfigStub({ guilds: [guild] }),
        homeDir: '/home/user',
        homePath,
        guildEntries: [
          {
            accessible: true,
            questsDirPath,
            questDirEntries: [createMockDirent({ isDir: true }), createMockDirent({ isDir: true })],
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
          chatSessions: [],
          valid: true,
          questCount: 2,
        },
      ]);
    });

    it('VALID: {guild not accessible} => returns list item with valid false', async () => {
      const proxy = guildListBrokerProxy();
      const homePath = FilePathStub({ value: '/home/user/.dungeonmaster' });
      const guild = GuildStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'Missing App',
        path: '/home/user/missing-app',
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const questsDirPath = FilePathStub({
        value: '/home/user/.dungeonmaster/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/quests',
      });

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
          chatSessions: [],
          valid: false,
          questCount: 0,
        },
      ]);
    });

    it('VALID: {multiple guilds} => returns list items for each guild', async () => {
      const proxy = guildListBrokerProxy();
      const homePath = FilePathStub({ value: '/home/user/.dungeonmaster' });
      const guild1 = GuildStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'First App',
        path: '/home/user/first-app',
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const guild2 = GuildStub({
        id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        name: 'Second App',
        path: '/home/user/second-app',
        createdAt: '2024-02-20T12:00:00.000Z',
      });
      const questsDirPath1 = FilePathStub({
        value: '/home/user/.dungeonmaster/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/quests',
      });
      const questsDirPath2 = FilePathStub({
        value: '/home/user/.dungeonmaster/guilds/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/quests',
      });

      proxy.setupGuildList({
        config: GuildConfigStub({ guilds: [guild1, guild2] }),
        homeDir: '/home/user',
        homePath,
        guildEntries: [
          {
            accessible: true,
            questsDirPath: questsDirPath1,
            questDirEntries: [createMockDirent({ isDir: true })],
          },
          {
            accessible: true,
            questsDirPath: questsDirPath2,
            questDirEntries: [
              createMockDirent({ isDir: true }),
              createMockDirent({ isDir: true }),
              createMockDirent({ isDir: true }),
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
          chatSessions: [],
          valid: true,
          questCount: 1,
        },
        {
          id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
          name: 'Second App',
          path: '/home/user/second-app',
          urlSlug: 'my-guild',
          createdAt: '2024-02-20T12:00:00.000Z',
          chatSessions: [],
          valid: true,
          questCount: 3,
        },
      ]);
    });

    it('VALID: {entries with non-directory files} => counts only directories as quests', async () => {
      const proxy = guildListBrokerProxy();
      const homePath = FilePathStub({ value: '/home/user/.dungeonmaster' });
      const guild = GuildStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'My App',
        path: '/home/user/my-app',
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const questsDirPath = FilePathStub({
        value: '/home/user/.dungeonmaster/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/quests',
      });

      proxy.setupGuildList({
        config: GuildConfigStub({ guilds: [guild] }),
        homeDir: '/home/user',
        homePath,
        guildEntries: [
          {
            accessible: true,
            questsDirPath,
            questDirEntries: [
              createMockDirent({ isDir: true }),
              createMockDirent({ isDir: false }),
              createMockDirent({ isDir: true }),
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
          chatSessions: [],
          valid: true,
          questCount: 2,
        },
      ]);
    });
  });

  describe('empty config', () => {
    it('EMPTY: {no guilds in config} => returns empty array', async () => {
      const proxy = guildListBrokerProxy();
      const homePath = FilePathStub({ value: '/home/user/.dungeonmaster' });

      proxy.setupEmptyConfig({ homeDir: '/home/user', homePath });

      const result = await guildListBroker();

      expect(result).toStrictEqual([]);
    });
  });
});
