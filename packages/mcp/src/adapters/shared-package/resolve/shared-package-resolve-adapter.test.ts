import { sharedPackageResolveAdapter } from './shared-package-resolve-adapter';
import { sharedPackageResolveAdapterProxy } from './shared-package-resolve-adapter.proxy';

describe('sharedPackageResolveAdapter', () => {
  describe('package found with src directory', () => {
    it('VALID: @dungeonmaster/shared installed with src => returns path ending with shared/src', () => {
      const proxy = sharedPackageResolveAdapterProxy();
      proxy.srcExists();

      const result = sharedPackageResolveAdapter();

      expect(result).not.toBeNull();
      expect(result).toMatch(/shared\/src$/u);
    });
  });

  describe('src directory does not exist', () => {
    it('VALID: @dungeonmaster/shared installed but no src => returns null', () => {
      const proxy = sharedPackageResolveAdapterProxy();
      proxy.srcDoesNotExist();

      const result = sharedPackageResolveAdapter();

      expect(result).toBeNull();
    });
  });
});
