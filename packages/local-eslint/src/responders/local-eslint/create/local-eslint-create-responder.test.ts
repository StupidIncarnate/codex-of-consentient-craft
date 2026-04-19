import { LocalEslintCreateResponderProxy } from './local-eslint-create-responder.proxy';

describe('LocalEslintCreateResponder', () => {
  describe('rule initialization', () => {
    it('VALID: {} => returns plugin with ban-quest-status-literals rule only', () => {
      const proxy = LocalEslintCreateResponderProxy();
      const plugin = proxy.callResponder();

      expect(Object.keys(plugin.rules).sort()).toStrictEqual(['ban-quest-status-literals']);
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
  });
});
