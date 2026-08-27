import { serverVersionReadAdapter } from './server-version-read-adapter';
import { serverVersionReadAdapterProxy } from './server-version-read-adapter.proxy';

describe('serverVersionReadAdapter', () => {
  describe('successful resolution', () => {
    it('VALID: {package.json version: "1.2.3"} => returns the branded version string', () => {
      const proxy = serverVersionReadAdapterProxy();
      proxy.returnsVersion({ version: '1.2.3' });

      const result = serverVersionReadAdapter();

      expect(result).toBe('1.2.3');
    });
  });

  describe('missing version field', () => {
    it('EDGE: {package.json has no version key} => returns "unknown"', () => {
      const proxy = serverVersionReadAdapterProxy();
      proxy.returnsPackageJsonWithoutVersion();

      const result = serverVersionReadAdapter();

      expect(result).toBe('unknown');
    });
  });

  describe('empty version field', () => {
    it('EMPTY: {package.json version: ""} => returns "unknown"', () => {
      const proxy = serverVersionReadAdapterProxy();
      proxy.returnsPackageJsonWithEmptyVersion();

      const result = serverVersionReadAdapter();

      expect(result).toBe('unknown');
    });
  });

  describe('read failure', () => {
    it('ERROR: {readFileSync throws} => returns "unknown" instead of throwing', () => {
      const proxy = serverVersionReadAdapterProxy();
      proxy.throwsReadError();

      const result = serverVersionReadAdapter();

      expect(result).toBe('unknown');
    });
  });
});
