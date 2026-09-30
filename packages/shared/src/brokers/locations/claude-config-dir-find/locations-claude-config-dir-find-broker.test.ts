import { locationsClaudeConfigDirFindBroker } from './locations-claude-config-dir-find-broker';
import { locationsClaudeConfigDirFindBrokerProxy } from './locations-claude-config-dir-find-broker.proxy';

describe('locationsClaudeConfigDirFindBroker', () => {
  describe('CLAUDE_CONFIG_DIR unset', () => {
    it('VALID: {homeDir: "/home/user"} => returns /home/user/.claude', () => {
      const proxy = locationsClaudeConfigDirFindBrokerProxy();

      proxy.setupUnset({ homeDir: '/home/user' });

      const result = locationsClaudeConfigDirFindBroker();

      expect(result).toBe('/home/user/.claude');
    });
  });

  describe('CLAUDE_CONFIG_DIR empty', () => {
    it('EMPTY: {CLAUDE_CONFIG_DIR: ""} => falls back to /home/user/.claude', () => {
      const proxy = locationsClaudeConfigDirFindBrokerProxy();

      proxy.setupUnset({ homeDir: '/home/user' });
      proxy.returns({ path: '' });

      const result = locationsClaudeConfigDirFindBroker();

      expect(result).toBe('/home/user/.claude');
    });
  });

  describe('CLAUDE_CONFIG_DIR set', () => {
    it('VALID: {CLAUDE_CONFIG_DIR: "/custom/claude"} => returns it verbatim', () => {
      const proxy = locationsClaudeConfigDirFindBrokerProxy();

      proxy.returns({ path: '/custom/claude' });

      const result = locationsClaudeConfigDirFindBroker();

      proxy.setupUnset({ homeDir: '/home/user' });

      expect(result).toBe('/custom/claude');
    });

    it('INVALID: {CLAUDE_CONFIG_DIR: "relative/claude"} => throws naming CLAUDE_CONFIG_DIR', () => {
      const proxy = locationsClaudeConfigDirFindBrokerProxy();

      proxy.returns({ path: 'relative/claude' });

      expect(() => locationsClaudeConfigDirFindBroker()).toThrow(
        /CLAUDE_CONFIG_DIR must be an absolute path, got "relative\/claude"/u,
      );

      proxy.setupUnset({ homeDir: '/home/user' });

      expect(locationsClaudeConfigDirFindBroker()).toBe('/home/user/.claude');
    });
  });
});
