import { LocalEslintFlow } from './local-eslint-flow';

describe('LocalEslintFlow', () => {
  describe('delegation to responder', () => {
    it('VALID: {} => delegates to responder and returns plugin with both repo-local rules', () => {
      const plugin = LocalEslintFlow();

      expect(Object.keys(plugin.rules).sort()).toStrictEqual([
        'ban-quest-status-literals',
        'no-bare-location-literals',
      ]);
    });
  });
});
