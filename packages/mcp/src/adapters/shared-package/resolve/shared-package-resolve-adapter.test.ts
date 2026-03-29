import { sharedPackageResolveAdapter } from './shared-package-resolve-adapter';
import { sharedPackageResolveAdapterProxy } from './shared-package-resolve-adapter.proxy';

describe('sharedPackageResolveAdapter', () => {
  describe('package found', () => {
    it('VALID: @dungeonmaster/shared installed => returns path ending with shared', () => {
      const proxy = sharedPackageResolveAdapterProxy();
      proxy.packageRootExists();

      const result = sharedPackageResolveAdapter();

      expect(result).not.toBe(null);
      expect(result).toMatch(/shared$/u);
    });
  });

  describe('package root does not exist', () => {
    it('VALID: @dungeonmaster/shared installed but package root missing => returns null', () => {
      const proxy = sharedPackageResolveAdapterProxy();
      proxy.packageRootDoesNotExist();

      const result = sharedPackageResolveAdapter();

      expect(result).toBe(null);
    });
  });
});
