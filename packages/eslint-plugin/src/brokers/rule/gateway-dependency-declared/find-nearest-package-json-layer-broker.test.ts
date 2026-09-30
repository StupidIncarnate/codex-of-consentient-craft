import { findNearestPackageJsonLayerBroker } from './find-nearest-package-json-layer-broker';
import { findNearestPackageJsonLayerBrokerProxy } from './find-nearest-package-json-layer-broker.proxy';

describe('findNearestPackageJsonLayerBroker', () => {
  describe('package.json found', () => {
    it('VALID: {startDir under a package} => returns the parsed package.json and its path', () => {
      const proxy = findNearestPackageJsonLayerBrokerProxy();
      proxy.setupPackageJson({
        packageDir: '/repo/packages/hooks',
        packageJson: { name: '@dungeonmaster/hooks', dependencies: { '@dungeonmaster/npm': '*' } },
      });

      const result = findNearestPackageJsonLayerBroker({
        startDir: '/repo/packages/hooks/src/brokers/x',
      });

      expect(result).toStrictEqual({
        packageJsonPath: '/repo/packages/hooks/package.json',
        packageJson: { name: '@dungeonmaster/hooks', dependencies: { '@dungeonmaster/npm': '*' } },
      });
    });
  });

  describe('no ancestor package.json', () => {
    it('EMPTY: {no ancestor holds package.json} => returns undefined', () => {
      const proxy = findNearestPackageJsonLayerBrokerProxy();
      proxy.setupNoPackageJsonAt({ dirPath: '/orphan/src' });
      proxy.setupNoPackageJsonAt({ dirPath: '/orphan' });
      proxy.setupNoPackageJsonAt({ dirPath: '/' });

      const result = findNearestPackageJsonLayerBroker({
        startDir: '/orphan/src',
      });

      expect(result).toBe(undefined);
    });
  });

  describe('caching', () => {
    it('VALID: {same package dir twice} => reads package.json only once', () => {
      const proxy = findNearestPackageJsonLayerBrokerProxy();
      proxy.setupPackageJson({
        packageDir: '/repo/packages/cache-a',
        packageJson: { name: '@dungeonmaster/cache-a' },
      });

      findNearestPackageJsonLayerBroker({
        startDir: '/repo/packages/cache-a/src/a',
      });
      findNearestPackageJsonLayerBroker({
        startDir: '/repo/packages/cache-a/src/b',
      });

      const readCount = proxy.countPackageJsonReads({ packageDir: '/repo/packages/cache-a' });

      expect(readCount).toBe(1);
    });
  });
});
