import { LocalEslintFlow } from './local-eslint-flow';

describe('LocalEslintFlow', () => {
  describe('delegation to responder', () => {
    it('VALID: {} => delegates to responder and returns plugin with every repo-local rule', () => {
      const plugin = LocalEslintFlow();

      expect(Object.keys(plugin.rules).sort()).toStrictEqual([
        'ban-quest-status-literals',
        'no-bare-location-literals',
        'no-hardcoded-package-names',
      ]);
    });
  });
});
