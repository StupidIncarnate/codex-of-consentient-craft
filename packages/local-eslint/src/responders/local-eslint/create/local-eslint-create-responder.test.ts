import { LocalEslintCreateResponderProxy } from './local-eslint-create-responder.proxy';

describe('LocalEslintCreateResponder', () => {
  describe('rule initialization', () => {
    it('VALID: {} => returns plugin with every repo-local rule', () => {
      const proxy = LocalEslintCreateResponderProxy();
      const plugin = proxy.callResponder();

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

    it('VALID: {} => returns ban-quest-status-literals rule with problem type', () => {
      const proxy = LocalEslintCreateResponderProxy();
      const plugin = proxy.callResponder();

      expect(plugin.rules['ban-quest-status-literals'].meta.type).toBe('problem');
    });

    it('VALID: {} => returns ban-quest-status-literals rule with create function', () => {
      const proxy = LocalEslintCreateResponderProxy();
      const plugin = proxy.callResponder();

      expect(plugin.rules['ban-quest-status-literals'].create).toStrictEqual(expect.any(Function));
    });

    it('VALID: {} => returns no-bare-location-literals rule with problem type', () => {
      const proxy = LocalEslintCreateResponderProxy();
      const plugin = proxy.callResponder();

      expect(plugin.rules['no-bare-location-literals'].meta.type).toBe('problem');
    });

    it('VALID: {} => returns no-bare-location-literals rule with create function', () => {
      const proxy = LocalEslintCreateResponderProxy();
      const plugin = proxy.callResponder();

      expect(plugin.rules['no-bare-location-literals'].create).toStrictEqual(expect.any(Function));
    });

    it('VALID: {} => returns no-hardcoded-package-names rule with problem type', () => {
      const proxy = LocalEslintCreateResponderProxy();
      const plugin = proxy.callResponder();

      expect(plugin.rules['no-hardcoded-package-names'].meta.type).toBe('problem');
    });

    it('VALID: {} => returns no-hardcoded-package-names rule with create function', () => {
      const proxy = LocalEslintCreateResponderProxy();
      const plugin = proxy.callResponder();

      expect(plugin.rules['no-hardcoded-package-names'].create).toStrictEqual(expect.any(Function));
    });

    it('VALID: {} => returns ban-locator-pick rule with problem type', () => {
      const proxy = LocalEslintCreateResponderProxy();
      const plugin = proxy.callResponder();

      expect(plugin.rules['ban-locator-pick'].meta.type).toBe('problem');
    });

    it('VALID: {} => returns ban-locator-pick rule with create function', () => {
      const proxy = LocalEslintCreateResponderProxy();
      const plugin = proxy.callResponder();

      expect(plugin.rules['ban-locator-pick'].create).toStrictEqual(expect.any(Function));
    });

    it('VALID: {} => returns ban-sync-seeding-methods rule with problem type', () => {
      const proxy = LocalEslintCreateResponderProxy();
      const plugin = proxy.callResponder();

      expect(plugin.rules['ban-sync-seeding-methods'].meta.type).toBe('problem');
    });

    it('VALID: {} => returns ban-sync-seeding-methods rule with create function', () => {
      const proxy = LocalEslintCreateResponderProxy();
      const plugin = proxy.callResponder();

      expect(plugin.rules['ban-sync-seeding-methods'].create).toStrictEqual(expect.any(Function));
    });

    it('VALID: {} => returns ban-direct-io-in-test-scenarios rule with problem type', () => {
      const proxy = LocalEslintCreateResponderProxy();
      const plugin = proxy.callResponder();

      expect(plugin.rules['ban-direct-io-in-test-scenarios'].meta.type).toBe('problem');
    });

    it('VALID: {} => returns ban-direct-io-in-test-scenarios rule with create function', () => {
      const proxy = LocalEslintCreateResponderProxy();
      const plugin = proxy.callResponder();

      expect(plugin.rules['ban-direct-io-in-test-scenarios'].create).toStrictEqual(
        expect.any(Function),
      );
    });

    it('VALID: {} => returns graph-reachability rule with problem type', () => {
      const proxy = LocalEslintCreateResponderProxy();
      const plugin = proxy.callResponder();

      expect(plugin.rules['graph-reachability'].meta.type).toBe('problem');
    });

    it('VALID: {} => returns graph-reachability rule with create function', () => {
      const proxy = LocalEslintCreateResponderProxy();
      const plugin = proxy.callResponder();

      expect(plugin.rules['graph-reachability'].create).toStrictEqual(expect.any(Function));
    });

    it('VALID: {} => returns ban-ambient-module-resolve rule with problem type', () => {
      const proxy = LocalEslintCreateResponderProxy();
      const plugin = proxy.callResponder();

      expect(plugin.rules['ban-ambient-module-resolve'].meta.type).toBe('problem');
    });

    it('VALID: {} => returns ban-ambient-module-resolve rule with create function', () => {
      const proxy = LocalEslintCreateResponderProxy();
      const plugin = proxy.callResponder();

      expect(plugin.rules['ban-ambient-module-resolve'].create).toStrictEqual(expect.any(Function));
    });

    it('VALID: {} => returns ban-self-located-repo-lookup rule with problem type', () => {
      const proxy = LocalEslintCreateResponderProxy();
      const plugin = proxy.callResponder();

      expect(plugin.rules['ban-self-located-repo-lookup'].meta.type).toBe('problem');
    });

    it('VALID: {} => returns ban-self-located-repo-lookup rule with create function', () => {
      const proxy = LocalEslintCreateResponderProxy();
      const plugin = proxy.callResponder();

      expect(plugin.rules['ban-self-located-repo-lookup'].create).toStrictEqual(
        expect.any(Function),
      );
    });

    it('VALID: {} => returns enforce-quest-cwd-resolve rule with problem type', () => {
      const proxy = LocalEslintCreateResponderProxy();
      const plugin = proxy.callResponder();

      expect(plugin.rules['enforce-quest-cwd-resolve'].meta.type).toBe('problem');
    });

    it('VALID: {} => returns enforce-quest-cwd-resolve rule with create function', () => {
      const proxy = LocalEslintCreateResponderProxy();
      const plugin = proxy.callResponder();

      expect(plugin.rules['enforce-quest-cwd-resolve'].create).toStrictEqual(expect.any(Function));
    });
  });
});
