import { locationsNodeModulesPathFindBroker } from './locations-node-modules-path-find-broker';
import { locationsNodeModulesPathFindBrokerProxy } from './locations-node-modules-path-find-broker.proxy';

describe('locationsNodeModulesPathFindBroker', () => {
  describe('node_modules path resolution', () => {
    it('VALID: {rootPath: "/repo"} => returns /repo/node_modules', () => {
      const proxy = locationsNodeModulesPathFindBrokerProxy();

      proxy.setupNodeModulesPath({
        nodeModulesPath: '/repo/node_modules',
      });

      const result = locationsNodeModulesPathFindBroker({
        rootPath: '/repo',
      });

      expect(result).toBe('/repo/node_modules');
    });

    it('VALID: {rootPath: "/repo/worktrees/add-auth-7bc217a1"} => resolves worktree-local node_modules', () => {
      const proxy = locationsNodeModulesPathFindBrokerProxy();

      proxy.setupNodeModulesPath({
        nodeModulesPath: '/repo/worktrees/add-auth-7bc217a1/node_modules',
      });

      const result = locationsNodeModulesPathFindBroker({
        rootPath: '/repo/worktrees/add-auth-7bc217a1',
      });

      expect(result).toBe(
        '/repo/worktrees/add-auth-7bc217a1/node_modules',
      );
    });
  });
});
