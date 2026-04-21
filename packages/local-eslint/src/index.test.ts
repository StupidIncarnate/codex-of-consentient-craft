import plugin, { StartLocalEslint } from './index';

describe('local-eslint index', () => {
  describe('named export', () => {
    it('VALID: {} => exports StartLocalEslint function that returns plugin with ban-quest-status-literals rule', () => {
      const result = StartLocalEslint();

      expect(Object.keys(result.rules).sort()).toStrictEqual(['ban-quest-status-literals']);
    });
  });

  describe('default export', () => {
    it('VALID: {} => default export is the plugin instance with ban-quest-status-literals rule', () => {
      expect(Object.keys(plugin.rules).sort()).toStrictEqual(['ban-quest-status-literals']);
    });
  });
});
