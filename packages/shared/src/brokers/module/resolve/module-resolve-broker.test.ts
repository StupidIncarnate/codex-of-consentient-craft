import { moduleResolveBroker } from './module-resolve-broker';
import { moduleResolveBrokerProxy } from './module-resolve-broker.proxy';

describe('moduleResolveBroker', () => {
  describe('the run root has the module', () => {
    it('VALID: {specifier, repoRoot with node_modules} => returns the run root path, resolvedFrom run-root', () => {
      const proxy = moduleResolveBrokerProxy();
      const specifier = '@dungeonmaster/cli/package.json';
      const repoRoot = '/repo/worktrees/quest-a';
      proxy.setupResolvesFromRunRoot({
        specifier,
        repoRoot,
        path: '/repo/worktrees/quest-a/node_modules/@dungeonmaster/cli/package.json',
      });

      const result = moduleResolveBroker({ specifier, repoRoot });

      expect(result).toStrictEqual({
        path: '/repo/worktrees/quest-a/node_modules/@dungeonmaster/cli/package.json',
        resolvedFrom: 'run-root',
      });
    });
  });

  describe('only this process own install has the module', () => {
    it('VALID: {repoRoot with no node_modules} => falls back to the own install, resolvedFrom own-install', () => {
      const proxy = moduleResolveBrokerProxy();
      const specifier = '@dungeonmaster/siegelense/brokers';
      const repoRoot = '/consumer/no-modules';
      proxy.setupResolvesFromOwnInstall({
        specifier,
        repoRoot,
        path: '/usr/lib/node_modules/dungeonmaster/node_modules/@dungeonmaster/siegelense/dist/brokers.js',
      });

      const result = moduleResolveBroker({ specifier, repoRoot });

      expect(result).toStrictEqual({
        path: '/usr/lib/node_modules/dungeonmaster/node_modules/@dungeonmaster/siegelense/dist/brokers.js',
        resolvedFrom: 'own-install',
      });
    });
  });

  describe('nothing has the module', () => {
    it('ERROR: {specifier installed nowhere} => throws naming the specifier and the repoRoot', () => {
      const proxy = moduleResolveBrokerProxy();
      const specifier = '@dungeonmaster/missing/package.json';
      const repoRoot = '/repo/worktrees/quest-b';
      proxy.setupResolvesNowhere({ specifier, repoRoot });

      expect(() => moduleResolveBroker({ specifier, repoRoot })).toThrow(
        /^moduleResolveBroker: cannot resolve "@dungeonmaster\/missing\/package\.json" from run root \/repo\/worktrees\/quest-b or from this process's own install$/u,
      );
    });
  });
});
