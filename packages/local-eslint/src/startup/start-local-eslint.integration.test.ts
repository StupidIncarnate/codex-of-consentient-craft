import { StartLocalEslint } from './start-local-eslint';

describe('StartLocalEslint', () => {
  describe('wiring to local-eslint flow', () => {
    it('VALID: {} => delegates to flow and returns plugin with ban-quest-status-literals rule', () => {
      const plugin = StartLocalEslint();

      expect(Object.keys(plugin.rules).sort()).toStrictEqual(['ban-quest-status-literals']);
    });
  });
});
