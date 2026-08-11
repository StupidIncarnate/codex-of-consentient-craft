import { LocalEslintCreateResponderProxy } from './local-eslint-create-responder.proxy';

describe('LocalEslintCreateResponder', () => {
  describe('rule initialization', () => {
    it('VALID: {} => returns plugin with every repo-local rule', () => {
      const proxy = LocalEslintCreateResponderProxy();
      const plugin = proxy.callResponder();

      expect(Object.keys(plugin.rules).sort()).toStrictEqual([
        'ban-quest-status-literals',
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
  });
});
