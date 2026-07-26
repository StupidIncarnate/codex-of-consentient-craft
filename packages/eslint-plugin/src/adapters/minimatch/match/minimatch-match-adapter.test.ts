import { minimatchMatchAdapter } from './minimatch-match-adapter';
import { minimatchMatchAdapterProxy } from './minimatch-match-adapter.proxy';

describe('minimatchMatchAdapter', () => {
  describe('successful operations', () => {
    it('VALID: {filePath: matching, pattern: matching glob} => returns true', () => {
      const proxy = minimatchMatchAdapterProxy();
      const filePath = 'src/startup/start-install.ts';
      const pattern = '**/src/startup/start-install.ts';
      proxy.returns({ filePath, pattern, result: true });

      const result = minimatchMatchAdapter({ filePath, pattern });

      expect(result).toBe(true);
    });

    it('VALID: {filePath: non-matching, pattern: glob} => returns false', () => {
      const proxy = minimatchMatchAdapterProxy();
      const filePath = 'src/brokers/foo/foo-broker.ts';
      const pattern = '**/src/startup/start-install.ts';
      proxy.returns({ filePath, pattern, result: false });

      const result = minimatchMatchAdapter({ filePath, pattern });

      expect(result).toBe(false);
    });
  });
});
