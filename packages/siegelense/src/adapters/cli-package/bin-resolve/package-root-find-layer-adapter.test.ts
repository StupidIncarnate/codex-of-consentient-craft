import { packageRootFindLayerAdapter } from './package-root-find-layer-adapter';
import { packageRootFindLayerAdapterProxy } from './package-root-find-layer-adapter.proxy';

describe('packageRootFindLayerAdapter', () => {
  describe('immediate match', () => {
    it('VALID: {startDir: dir with a package.json} => returns startDir', () => {
      const proxy = packageRootFindLayerAdapterProxy();
      proxy.packageRootExists();

      const result = packageRootFindLayerAdapter({ startDir: '/fake/repo/packages/cli' });

      expect(result).toBe('/fake/repo/packages/cli');
    });
  });

  describe('walking up', () => {
    it('VALID: {startDir: nested dir with no package.json} => returns the ancestor holding one', () => {
      const proxy = packageRootFindLayerAdapterProxy();
      proxy.packageRootDoesNotExist();
      proxy.setupPackageJsonAt({ dirPath: '/fake/repo/packages/cli', exists: true });

      const result = packageRootFindLayerAdapter({ startDir: '/fake/repo/packages/cli/dist' });

      expect(result).toBe('/fake/repo/packages/cli');
    });
  });

  describe('not found', () => {
    it('EMPTY: {startDir: no ancestor has a package.json} => returns null', () => {
      const proxy = packageRootFindLayerAdapterProxy();
      proxy.packageRootDoesNotExist();

      const result = packageRootFindLayerAdapter({ startDir: '/fake-unreachable/deep/path' });

      expect(result).toBe(null);
    });
  });
});
