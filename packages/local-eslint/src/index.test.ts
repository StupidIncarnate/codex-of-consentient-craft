import plugin, { StartLocalEslint } from './index';

describe('local-eslint index', () => {
  describe('named export', () => {
    it('VALID: {} => exports StartLocalEslint function that returns plugin with every repo-local rule', () => {
      const result = StartLocalEslint();

      expect(Object.keys(result.rules).sort()).toStrictEqual([
        'ban-ambient-module-resolve',
        'ban-direct-io-in-test-scenarios',
        'ban-locator-pick',
        'ban-quest-status-literals',
        'ban-self-located-repo-lookup',
        'ban-sync-seeding-methods',
        'enforce-quest-cwd-resolve',
        'graph-reachability',
        'no-bare-location-literals',
        'no-hardcoded-package-names',
      ]);
    });
  });

  describe('default export', () => {
    it('VALID: {} => default export is the plugin instance with every repo-local rule', () => {
      expect(Object.keys(plugin.rules).sort()).toStrictEqual([
        'ban-ambient-module-resolve',
        'ban-direct-io-in-test-scenarios',
        'ban-locator-pick',
        'ban-quest-status-literals',
        'ban-self-located-repo-lookup',
        'ban-sync-seeding-methods',
        'enforce-quest-cwd-resolve',
        'graph-reachability',
        'no-bare-location-literals',
        'no-hardcoded-package-names',
      ]);
    });
  });
});
