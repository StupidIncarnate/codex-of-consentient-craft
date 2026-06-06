import { GuildStub, RepoRootCwdStub } from '@dungeonmaster/shared/contracts';

import { guildCoversRepoRootGuard } from './guild-covers-repo-root-guard';

describe('guildCoversRepoRootGuard', () => {
  describe('covering matches', () => {
    it('VALID: {guild.path === repoRoot} => returns true', () => {
      const guild = GuildStub({ path: '/home/user/repo' });
      const repoRoot = RepoRootCwdStub({ value: '/home/user/repo' });

      const result = guildCoversRepoRootGuard({ guild, repoRoot });

      expect(result).toBe(true);
    });

    it('VALID: {guild.path ancestor of repoRoot} => returns true', () => {
      const guild = GuildStub({ path: '/home/user' });
      const repoRoot = RepoRootCwdStub({ value: '/home/user/repo' });

      const result = guildCoversRepoRootGuard({ guild, repoRoot });

      expect(result).toBe(true);
    });

    it('VALID: {guild.path trailing slash, repoRoot no slash, same dir} => returns true', () => {
      const guild = GuildStub({ path: '/home/user/repo/' });
      const repoRoot = RepoRootCwdStub({ value: '/home/user/repo' });

      const result = guildCoversRepoRootGuard({ guild, repoRoot });

      expect(result).toBe(true);
    });
  });

  describe('non-covering matches', () => {
    it('EDGE: {guild.path sibling prefix of repoRoot} => returns false', () => {
      const guild = GuildStub({ path: '/home/user/repo' });
      const repoRoot = RepoRootCwdStub({ value: '/home/user/repo-other' });

      const result = guildCoversRepoRootGuard({ guild, repoRoot });

      expect(result).toBe(false);
    });

    it('EDGE: {guild.path descendant of repoRoot} => returns false', () => {
      const guild = GuildStub({ path: '/home/user/repo/packages' });
      const repoRoot = RepoRootCwdStub({ value: '/home/user/repo' });

      const result = guildCoversRepoRootGuard({ guild, repoRoot });

      expect(result).toBe(false);
    });

    it('EDGE: {guild.path unrelated to repoRoot} => returns false', () => {
      const guild = GuildStub({ path: '/var/lib/other' });
      const repoRoot = RepoRootCwdStub({ value: '/home/user/repo' });

      const result = guildCoversRepoRootGuard({ guild, repoRoot });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {guild: undefined} => returns false', () => {
      const repoRoot = RepoRootCwdStub({ value: '/home/user/repo' });

      const result = guildCoversRepoRootGuard({ repoRoot });

      expect(result).toBe(false);
    });

    it('EMPTY: {repoRoot: undefined} => returns false', () => {
      const guild = GuildStub({ path: '/home/user/repo' });

      const result = guildCoversRepoRootGuard({ guild });

      expect(result).toBe(false);
    });

    it('EMPTY: {both undefined} => returns false', () => {
      const result = guildCoversRepoRootGuard({});

      expect(result).toBe(false);
    });
  });
});
