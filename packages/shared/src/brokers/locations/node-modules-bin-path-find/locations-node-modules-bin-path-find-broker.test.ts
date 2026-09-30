import { locationsNodeModulesBinPathFindBroker } from './locations-node-modules-bin-path-find-broker';
import { locationsNodeModulesBinPathFindBrokerProxy } from './locations-node-modules-bin-path-find-broker.proxy';

describe('locationsNodeModulesBinPathFindBroker', () => {
  describe('binary path resolution', () => {
    it('VALID: {rootPath: "/repo", binName: "jest"} => returns /repo/node_modules/.bin/jest', () => {
      const proxy = locationsNodeModulesBinPathFindBrokerProxy();

      proxy.setupBinPath({
        binPath: '/repo/node_modules/.bin/jest',
      });

      const result = locationsNodeModulesBinPathFindBroker({
        rootPath: '/repo',
        binName: 'jest',
      });

      expect(result).toBe('/repo/node_modules/.bin/jest');
    });

    it('VALID: {rootPath: "/repo/packages/web", binName: "tsc"} => resolves workspace-local bin', () => {
      const proxy = locationsNodeModulesBinPathFindBrokerProxy();

      proxy.setupBinPath({
        binPath: '/repo/packages/web/node_modules/.bin/tsc',
      });

      const result = locationsNodeModulesBinPathFindBroker({
        rootPath: '/repo/packages/web',
        binName: 'tsc',
      });

      expect(result).toBe('/repo/packages/web/node_modules/.bin/tsc');
    });
  });
});
