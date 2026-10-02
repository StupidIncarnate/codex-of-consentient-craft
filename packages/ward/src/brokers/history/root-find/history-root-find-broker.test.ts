import { historyRootFindBroker } from './history-root-find-broker';
import { historyRootFindBrokerProxy } from './history-root-find-broker.proxy';

describe('historyRootFindBroker', () => {
  describe('main checkout', () => {
    it('VALID: {rootPath: "/repo", commonDir: "/repo/.git"} => returns repository root', async () => {
      const proxy = historyRootFindBrokerProxy();
      proxy.setupCommonDirFound({ commonDir: '/repo/.git' });

      const result = await historyRootFindBroker({ rootPath: '/repo' });

      expect(result).toBe('/repo');
    });
  });

  describe('worktree', () => {
    it('VALID: {rootPath: "/repo/worktrees/x", commonDir: "/repo/.git"} => returns main repository root', async () => {
      const proxy = historyRootFindBrokerProxy();
      proxy.setupCommonDirFound({ commonDir: '/repo/.git' });

      const result = await historyRootFindBroker({ rootPath: '/repo/worktrees/x' });

      expect(result).toBe('/repo');
    });
  });

  describe('not a git repository', () => {
    it('EMPTY: {rootPath: "/not/a/repo", commonDir: null} => returns rootPath unchanged', async () => {
      const proxy = historyRootFindBrokerProxy();
      proxy.setupCommonDirNull();

      const result = await historyRootFindBroker({ rootPath: '/not/a/repo' });

      expect(result).toBe('/not/a/repo');
    });
  });

  describe('git is not installed', () => {
    it('ERROR: {rootPath: "/repo", GitNotInstalledError thrown} => returns rootPath unchanged', async () => {
      const proxy = historyRootFindBrokerProxy();
      proxy.setupGitMissing();

      const result = await historyRootFindBroker({ rootPath: '/repo' });

      expect(result).toBe('/repo');
    });
  });

  describe('bare repository path not ending in .git', () => {
    it('EDGE: {rootPath: "/repo/bare.git_other", commonDir: "/repo/bare.git_other"} => returns rootPath unchanged', async () => {
      const proxy = historyRootFindBrokerProxy();
      proxy.setupCommonDirFound({ commonDir: '/repo/bare.git_other' });

      const result = await historyRootFindBroker({ rootPath: '/repo/bare.git_other' });

      expect(result).toBe('/repo/bare.git_other');
    });
  });
});
