import {
  FilePathStub,
  GuildConfigStub,
  GuildStub,
  RepoRootCwdStub,
} from '@dungeonmaster/shared/contracts';

import { smoketestEnsureGuildBroker } from './smoketest-ensure-guild-broker';
import { smoketestEnsureGuildBrokerProxy } from './smoketest-ensure-guild-broker.proxy';

const CODEX_GUILD_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
const SECOND_GUILD_ID = '11111111-2222-3333-4444-555555555555';
const HOME_PATH = '/home/testuser/.dungeonmaster-dev';
const CODEX_REPO_ROOT = '/home/testuser/codex';
const OTHER_REPO_ROOT = '/home/testuser/other-repo';

describe('smoketestEnsureGuildBroker', () => {
  describe('single matching guild', () => {
    it('VALID: {one guild whose path resolves to the same repo root as home} => returns that guild id', async () => {
      const proxy = smoketestEnsureGuildBrokerProxy();
      proxy.setupPassthrough();

      const codexGuild = GuildStub({
        id: CODEX_GUILD_ID,
        name: 'codex',
        path: CODEX_REPO_ROOT,
        createdAt: '2024-01-15T10:00:00.000Z',
      });

      proxy.setupGuildPresent({
        config: GuildConfigStub({ guilds: [codexGuild] }),
        homeDir: '/home/testuser',
        homePath: FilePathStub({ value: HOME_PATH }),
        guildEntries: [
          {
            accessible: true,
            questsDirPath: FilePathStub({
              value: `${HOME_PATH}/guilds/${CODEX_GUILD_ID}/quests`,
            }),
            questDirEntries: [],
          },
        ],
        homeRepoRoot: RepoRootCwdStub({ value: CODEX_REPO_ROOT }),
        guildRepoRoots: [RepoRootCwdStub({ value: CODEX_REPO_ROOT })],
      });

      const result = await smoketestEnsureGuildBroker();

      expect(result).toStrictEqual({ guildId: CODEX_GUILD_ID });
    });
  });

  describe('multiple guilds, only one matches', () => {
    it('VALID: {two guilds, only the codex guild walks up to the home repo root} => returns the codex guild id', async () => {
      const proxy = smoketestEnsureGuildBrokerProxy();
      proxy.setupPassthrough();

      const codexGuild = GuildStub({
        id: CODEX_GUILD_ID,
        name: 'codex',
        path: CODEX_REPO_ROOT,
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const otherGuild = GuildStub({
        id: SECOND_GUILD_ID,
        name: 'other',
        path: OTHER_REPO_ROOT,
        createdAt: '2024-02-15T10:00:00.000Z',
      });

      proxy.setupGuildPresent({
        config: GuildConfigStub({ guilds: [codexGuild, otherGuild] }),
        homeDir: '/home/testuser',
        homePath: FilePathStub({ value: HOME_PATH }),
        guildEntries: [
          {
            accessible: true,
            questsDirPath: FilePathStub({
              value: `${HOME_PATH}/guilds/${CODEX_GUILD_ID}/quests`,
            }),
            questDirEntries: [],
          },
          {
            accessible: true,
            questsDirPath: FilePathStub({
              value: `${HOME_PATH}/guilds/${SECOND_GUILD_ID}/quests`,
            }),
            questDirEntries: [],
          },
        ],
        homeRepoRoot: RepoRootCwdStub({ value: CODEX_REPO_ROOT }),
        guildRepoRoots: [
          RepoRootCwdStub({ value: CODEX_REPO_ROOT }),
          RepoRootCwdStub({ value: OTHER_REPO_ROOT }),
        ],
      });

      const result = await smoketestEnsureGuildBroker();

      expect(result).toStrictEqual({ guildId: CODEX_GUILD_ID });
    });
  });

  describe('multiple matching guilds (tiebreaker)', () => {
    it('VALID: {two guilds whose paths both resolve to the home repo root} => returns the first by config order', async () => {
      const proxy = smoketestEnsureGuildBrokerProxy();
      proxy.setupPassthrough();

      const firstGuild = GuildStub({
        id: CODEX_GUILD_ID,
        name: 'codex',
        path: CODEX_REPO_ROOT,
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const secondGuild = GuildStub({
        id: SECOND_GUILD_ID,
        name: 'codex-alias',
        path: `${CODEX_REPO_ROOT}/packages/web`,
        createdAt: '2024-02-15T10:00:00.000Z',
      });

      proxy.setupGuildPresent({
        config: GuildConfigStub({ guilds: [firstGuild, secondGuild] }),
        homeDir: '/home/testuser',
        homePath: FilePathStub({ value: HOME_PATH }),
        guildEntries: [
          {
            accessible: true,
            questsDirPath: FilePathStub({
              value: `${HOME_PATH}/guilds/${CODEX_GUILD_ID}/quests`,
            }),
            questDirEntries: [],
          },
          {
            accessible: true,
            questsDirPath: FilePathStub({
              value: `${HOME_PATH}/guilds/${SECOND_GUILD_ID}/quests`,
            }),
            questDirEntries: [],
          },
        ],
        homeRepoRoot: RepoRootCwdStub({ value: CODEX_REPO_ROOT }),
        guildRepoRoots: [
          RepoRootCwdStub({ value: CODEX_REPO_ROOT }),
          RepoRootCwdStub({ value: CODEX_REPO_ROOT }),
        ],
      });

      const result = await smoketestEnsureGuildBroker();

      expect(result).toStrictEqual({ guildId: CODEX_GUILD_ID });
    });
  });

  describe('no matching guild', () => {
    it('ERROR: {no guild walks up to home repo root} => throws with guidance to create a guild', async () => {
      const proxy = smoketestEnsureGuildBrokerProxy();
      proxy.setupPassthrough();

      const otherGuild = GuildStub({
        id: SECOND_GUILD_ID,
        name: 'other',
        path: OTHER_REPO_ROOT,
        createdAt: '2024-02-15T10:00:00.000Z',
      });

      proxy.setupGuildPresent({
        config: GuildConfigStub({ guilds: [otherGuild] }),
        homeDir: '/home/testuser',
        homePath: FilePathStub({ value: HOME_PATH }),
        guildEntries: [
          {
            accessible: true,
            questsDirPath: FilePathStub({
              value: `${HOME_PATH}/guilds/${SECOND_GUILD_ID}/quests`,
            }),
            questDirEntries: [],
          },
        ],
        homeRepoRoot: RepoRootCwdStub({ value: CODEX_REPO_ROOT }),
        guildRepoRoots: [RepoRootCwdStub({ value: OTHER_REPO_ROOT })],
      });

      await expect(smoketestEnsureGuildBroker()).rejects.toThrow(
        /Smoketest requires a guild whose path resolves to the repo root/u,
      );
    });

    it('ERROR: {empty guild list} => throws with guidance to create a guild', async () => {
      const proxy = smoketestEnsureGuildBrokerProxy();
      proxy.setupPassthrough();

      proxy.setupGuildPresent({
        config: GuildConfigStub({ guilds: [] }),
        homeDir: '/home/testuser',
        homePath: FilePathStub({ value: HOME_PATH }),
        guildEntries: [],
        homeRepoRoot: RepoRootCwdStub({ value: CODEX_REPO_ROOT }),
        guildRepoRoots: [],
      });

      await expect(smoketestEnsureGuildBroker()).rejects.toThrow(
        /Smoketest requires a guild whose path resolves to the repo root/u,
      );
    });
  });

  describe('guild path resolution failure', () => {
    it('VALID: {first guild repo-root walk rejects, second matches} => skips the rejecting guild and returns the second', async () => {
      const proxy = smoketestEnsureGuildBrokerProxy();
      proxy.setupPassthrough();

      const broken = GuildStub({
        id: SECOND_GUILD_ID,
        name: 'broken',
        path: '/no/such/path',
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const codexGuild = GuildStub({
        id: CODEX_GUILD_ID,
        name: 'codex',
        path: CODEX_REPO_ROOT,
        createdAt: '2024-02-15T10:00:00.000Z',
      });

      proxy.setupGuildPresent({
        config: GuildConfigStub({ guilds: [broken, codexGuild] }),
        homeDir: '/home/testuser',
        homePath: FilePathStub({ value: HOME_PATH }),
        guildEntries: [
          {
            accessible: false,
            questsDirPath: FilePathStub({
              value: `${HOME_PATH}/guilds/${SECOND_GUILD_ID}/quests`,
            }),
            questDirEntries: [],
          },
          {
            accessible: true,
            questsDirPath: FilePathStub({
              value: `${HOME_PATH}/guilds/${CODEX_GUILD_ID}/quests`,
            }),
            questDirEntries: [],
          },
        ],
        homeRepoRoot: RepoRootCwdStub({ value: CODEX_REPO_ROOT }),
        guildRepoRoots: [null, RepoRootCwdStub({ value: CODEX_REPO_ROOT })],
      });

      const result = await smoketestEnsureGuildBroker();

      expect(result).toStrictEqual({ guildId: CODEX_GUILD_ID });
    });
  });
});
