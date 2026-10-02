import { LocalEslintFlow } from './local-eslint-flow';

describe('LocalEslintFlow', () => {
  describe('delegation to responder', () => {
    it('VALID: {} => delegates to responder and returns plugin with every repo-local rule', () => {
      const plugin = LocalEslintFlow();

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
