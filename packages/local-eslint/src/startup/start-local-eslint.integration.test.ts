import { StartLocalEslint } from './start-local-eslint';

describe('StartLocalEslint', () => {
  describe('wiring to local-eslint flow', () => {
    it('VALID: {} => delegates to flow and returns plugin with every repo-local rule', () => {
      const plugin = StartLocalEslint();

      expect(Object.keys(plugin.rules).sort()).toStrictEqual([
        'ban-bare-os-home-tmp',
        'ban-direct-io-in-test-scenarios',
        'ban-locator-pick',
        'ban-quest-status-literals',
        'ban-sync-seeding-methods',
        'graph-reachability',
        'no-bare-location-literals',
        'no-hardcoded-package-names',
      ]);
    });
  });
});
