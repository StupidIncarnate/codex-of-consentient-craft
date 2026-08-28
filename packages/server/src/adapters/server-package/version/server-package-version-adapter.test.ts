import { serverPackageVersionAdapter } from './server-package-version-adapter';
import { serverPackageVersionAdapterProxy } from './server-package-version-adapter.proxy';

describe('serverPackageVersionAdapter', () => {
  describe('successful reads', () => {
    it('VALID: {package.json version: "9.9.9"} => returns the staged version, not a literal', () => {
      const proxy = serverPackageVersionAdapterProxy();
      proxy.stagesVersion({ version: '9.9.9' });

      const result = serverPackageVersionAdapter();

      expect(result).toBe('9.9.9');
    });
  });

  describe('read failures', () => {
    it('ERROR: {readFileSync throws} => throws an Error naming the package.json subpath', () => {
      const proxy = serverPackageVersionAdapterProxy();
      proxy.readFails({ error: new Error('ENOENT: no such file or directory') });

      expect(() => serverPackageVersionAdapter()).toThrow(/@dungeonmaster\/server\/package\.json/u);
    });

    it('ERROR: {package.json has no version field} => throws without falling back', () => {
      const proxy = serverPackageVersionAdapterProxy();
      proxy.stagesMissingVersion();

      expect(() => serverPackageVersionAdapter()).toThrow(/@dungeonmaster\/server\/package\.json/u);
    });
  });
});
