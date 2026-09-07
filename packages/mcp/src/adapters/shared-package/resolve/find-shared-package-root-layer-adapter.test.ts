import { findSharedPackageRootLayerAdapter } from './find-shared-package-root-layer-adapter';
import { findSharedPackageRootLayerAdapterProxy } from './find-shared-package-root-layer-adapter.proxy';

describe('findSharedPackageRootLayerAdapter', () => {
  describe('immediate match', () => {
    it('VALID: {startDir: dir with a package.json} => returns startDir', () => {
      const proxy = findSharedPackageRootLayerAdapterProxy();
      proxy.packageRootExists();

      const result = findSharedPackageRootLayerAdapter({ startDir: '/fake/repo/packages/shared' });

      expect(result).toBe('/fake/repo/packages/shared');
    });
  });

  describe('walking up', () => {
    it('VALID: {startDir: nested dir with no package.json} => returns the ancestor holding one', () => {
      const proxy = findSharedPackageRootLayerAdapterProxy();
      proxy.packageRootDoesNotExist();
      proxy.setupPackageJsonAt({ dirPath: '/fake/repo/packages/shared', exists: true });

      const result = findSharedPackageRootLayerAdapter({
        startDir: '/fake/repo/packages/shared/dist',
      });

      expect(result).toBe('/fake/repo/packages/shared');
    });
  });

  describe('not found', () => {
    it('EMPTY: {startDir: no ancestor has a package.json} => returns null', () => {
      const proxy = findSharedPackageRootLayerAdapterProxy();
      proxy.packageRootDoesNotExist();

      const result = findSharedPackageRootLayerAdapter({ startDir: '/fake-unreachable/deep/path' });

      expect(result).toBe(null);
    });
  });
});
