import plugin, { StartLocalEslint } from './index';

describe('local-eslint index', () => {
  describe('named export', () => {
    it('VALID: {} => exports StartLocalEslint function that returns plugin with both repo-local rules', () => {
      const result = StartLocalEslint();

      expect(Object.keys(result.rules).sort()).toStrictEqual([
        'ban-quest-status-literals',
        'no-bare-location-literals',
      ]);
    });
  });

  describe('default export', () => {
    it('VALID: {} => default export is the plugin instance with both repo-local rules', () => {
      expect(Object.keys(plugin.rules).sort()).toStrictEqual([
        'ban-quest-status-literals',
        'no-bare-location-literals',
      ]);
    });
  });
});
