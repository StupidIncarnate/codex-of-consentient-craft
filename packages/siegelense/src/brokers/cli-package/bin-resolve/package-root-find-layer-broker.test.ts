import { packageRootFindLayerBroker } from './package-root-find-layer-broker';
import { packageRootFindLayerBrokerProxy } from './package-root-find-layer-broker.proxy';

describe('packageRootFindLayerBroker', () => {
  describe('immediate match', () => {
    it('VALID: {startDir: dir with a package.json} => returns startDir', () => {
      const proxy = packageRootFindLayerBrokerProxy();
      proxy.setupPackageJsonAt({ dirPath: '/fake/repo/packages/cli', exists: true });

      const result = packageRootFindLayerBroker({ startDir: '/fake/repo/packages/cli' });

      expect(result).toBe('/fake/repo/packages/cli');
    });
  });

  describe('walking up', () => {
    it('VALID: {startDir: nested dir with no package.json} => returns the ancestor holding one', () => {
      const proxy = packageRootFindLayerBrokerProxy();
      proxy.setupPackageJsonAt({ dirPath: '/fake/repo/packages/cli/dist', exists: false });
      proxy.setupPackageJsonAt({ dirPath: '/fake/repo/packages/cli', exists: true });

      const result = packageRootFindLayerBroker({ startDir: '/fake/repo/packages/cli/dist' });

      expect(result).toBe('/fake/repo/packages/cli');
    });
  });

  describe('not found', () => {
    it('EMPTY: {startDir: no ancestor has a package.json} => returns null', () => {
      const proxy = packageRootFindLayerBrokerProxy();
      proxy.setupNoPackageJsonFrom({ startDir: '/fake-unreachable/deep/path' });

      const result = packageRootFindLayerBroker({ startDir: '/fake-unreachable/deep/path' });

      expect(result).toBe(null);
    });
  });
});
