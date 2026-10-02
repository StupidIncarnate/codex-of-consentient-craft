import { StartLocalEslint } from './start-local-eslint';

describe('StartLocalEslint', () => {
  describe('wiring to local-eslint flow', () => {
    it('VALID: {} => delegates to flow and returns plugin with every repo-local rule', () => {
      const plugin = StartLocalEslint();

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
