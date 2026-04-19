import { LocalEslintFlow } from './local-eslint-flow';

describe('LocalEslintFlow', () => {
  describe('delegation to responder', () => {
    it('VALID: {} => delegates to responder and returns plugin with ban-quest-status-literals rule', () => {
      const plugin = LocalEslintFlow();

      expect(Object.keys(plugin.rules).sort()).toStrictEqual(['ban-quest-status-literals']);
    });
  });
});
