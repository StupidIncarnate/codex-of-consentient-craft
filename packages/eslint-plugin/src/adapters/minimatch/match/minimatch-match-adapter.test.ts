import { minimatchMatchAdapter } from './minimatch-match-adapter';
import { minimatchMatchAdapterProxy } from './minimatch-match-adapter.proxy';

describe('minimatchMatchAdapter', () => {
  describe('successful operations', () => {
    it('VALID: {filePath: matching, pattern: matching glob} => returns true', () => {
      const proxy = minimatchMatchAdapterProxy();
      proxy.returns({ result: true });

      const result = minimatchMatchAdapter({
        filePath: 'src/startup/start-install.ts',
        pattern: '**/src/startup/start-install.ts',
      });

      expect(result).toBe(true);
    });

    it('VALID: {filePath: non-matching, pattern: glob} => returns false', () => {
      const proxy = minimatchMatchAdapterProxy();
      proxy.returns({ result: false });

      const result = minimatchMatchAdapter({
        filePath: 'src/brokers/foo/foo-broker.ts',
        pattern: '**/src/startup/start-install.ts',
      });

      expect(result).toBe(false);
    });
  });
});
