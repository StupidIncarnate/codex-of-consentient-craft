import { cwdResolveBroker } from './cwd-resolve-broker';
import { cwdResolveBrokerProxy } from './cwd-resolve-broker.proxy';
import { GuildRootNotFoundError } from '../../../errors/guild-root-not-found/guild-root-not-found-error';

describe('cwdResolveBroker', () => {
  describe('kind: repo-root', () => {
    it('VALID: {startPath, kind: "repo-root"} => returns RepoRootCwd branded path', async () => {
      const proxy = cwdResolveBrokerProxy();
      const startPath = '/project';

      proxy.setupRepoRootFoundAtStart({ startPath: '/project' });

      const result = await cwdResolveBroker({ startPath, kind: 'repo-root' });

      expect(result).toBe('/project');
    });

    it('VALID: {startPath: child, kind: "repo-root"} => walks up to find .dungeonmaster.json', async () => {
      const proxy = cwdResolveBrokerProxy();
      const startPath = '/monorepo/packages/web';

      proxy.setupRepoRootFoundInParent({
        startPath: '/monorepo/packages/web',
        repoRoot: '/monorepo',
      });

      const result = await cwdResolveBroker({ startPath, kind: 'repo-root' });

      expect(result).toBe('/monorepo');
    });

    it('ERROR: {no .dungeonmaster.json anywhere up the tree, kind: "repo-root"} => rejects with ProjectRootNotFoundError naming the start path', async () => {
      const proxy = cwdResolveBrokerProxy();
      const startPath = '/scratch/no-config-here';

      proxy.setupRepoRootNotFound({ startPath: '/scratch/no-config-here' });

      await expect(cwdResolveBroker({ startPath, kind: 'repo-root' })).rejects.toThrow(
        /no-config-here/u,
      );
    });
  });

  describe('kind: project-root', () => {
    it('VALID: {startPath, kind: "project-root"} => returns ProjectRootCwd branded path', async () => {
      const proxy = cwdResolveBrokerProxy();
      const startPath = '/project';

      proxy.setupProjectRootFoundAtStart({ startPath: '/project' });

      const result = await cwdResolveBroker({ startPath, kind: 'project-root' });

      expect(result).toBe('/project');
    });

    it('VALID: {startPath: nested file, kind: "project-root"} => walks up to package.json', async () => {
      const proxy = cwdResolveBrokerProxy();
      const startPath = '/repo/packages/web/src/file.ts';

      proxy.setupProjectRootFoundInParent({
        startPath: '/repo/packages/web/src/file.ts',
        parentPath: '/repo/packages/web/src',
        projectRoot: '/repo/packages/web',
      });

      const result = await cwdResolveBroker({ startPath, kind: 'project-root' });

      expect(result).toBe('/repo/packages/web');
    });
  });

  describe('kind: guild-path', () => {
    it('VALID: {startPath, kind: "guild-path"} => returns GuildPathCwd branded path', async () => {
      const proxy = cwdResolveBrokerProxy();
      const startPath = '/dm/guilds/foo';

      proxy.setupGuildPathFoundAtStart({ startPath: '/dm/guilds/foo' });

      const result = await cwdResolveBroker({ startPath, kind: 'guild-path' });

      expect(result).toBe('/dm/guilds/foo');
    });

    it('VALID: {startPath: child, kind: "guild-path"} => walks up to guild.json', async () => {
      const proxy = cwdResolveBrokerProxy();
      const startPath = '/dm/guilds/foo/quests/q1';

      proxy.setupGuildPathFoundInParent({
        startPath: '/dm/guilds/foo/quests/q1',
        guildPath: '/dm/guilds/foo',
      });

      const result = await cwdResolveBroker({ startPath, kind: 'guild-path' });

      expect(result).toBe('/dm/guilds/foo');
    });

    it('EDGE: {startPath: no guild, kind: "guild-path"} => throws GuildRootNotFoundError', async () => {
      const proxy = cwdResolveBrokerProxy();
      const startPath = '/no-guild';

      proxy.setupGuildPathNotFound({ startPath: '/no-guild' });

      await expect(cwdResolveBroker({ startPath, kind: 'guild-path' })).rejects.toThrow(
        GuildRootNotFoundError,
      );
    });
  });

  describe('kind: dungeonmaster-home', () => {
    it('VALID: {kind: "dungeonmaster-home"} => returns DungeonmasterHomeCwd from homedir', async () => {
      const proxy = cwdResolveBrokerProxy();
      const startPath = '/anywhere';

      proxy.setupDungeonmasterHomeFromHomedir({
        homeDir: '/home/user',
        homePath: '/home/user/.dungeonmaster',
      });

      const result = await cwdResolveBroker({ startPath, kind: 'dungeonmaster-home' });
      proxy.clearDungeonmasterHomeEnv();

      expect(result).toBe('/home/user/.dungeonmaster');
    });

    it('VALID: {kind: "dungeonmaster-home"} with DUNGEONMASTER_HOME env => returns env value', async () => {
      const proxy = cwdResolveBrokerProxy();
      const startPath = '/anywhere';

      proxy.setupDungeonmasterHomeFromEnv({ homePath: '/custom/dm-home' });

      const result = await cwdResolveBroker({ startPath, kind: 'dungeonmaster-home' });
      proxy.clearDungeonmasterHomeEnv();

      expect(result).toBe('/custom/dm-home');
    });
  });

  describe('invalid kind', () => {
    it('ERROR: {kind: "unknown"} => throws Error', async () => {
      cwdResolveBrokerProxy();
      const startPath = '/project';

      await expect(cwdResolveBroker({ startPath, kind: 'unknown' as never })).rejects.toThrow(
        /Unknown cwd kind: unknown/u,
      );
    });
  });
});
