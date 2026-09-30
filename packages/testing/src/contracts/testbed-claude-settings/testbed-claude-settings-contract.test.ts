import { testbedClaudeSettingsContract } from './testbed-claude-settings-contract';
import { TestbedClaudeSettingsStub } from './testbed-claude-settings.stub';

describe('testbedClaudeSettingsContract', () => {
  describe('valid inputs', () => {
    it('EMPTY: {} => parses with no keys', () => {
      expect(TestbedClaudeSettingsStub()).toStrictEqual({});
    });

    it('VALID: {hooks, permissions.allow, extra key} => keeps every key', () => {
      const settings = testbedClaudeSettingsContract.parse({
        hooks: { PreToolUse: [] },
        permissions: { allow: ['mcp__dungeonmaster__discover'], deny: [] },
        model: 'opus',
      });

      expect(settings).toStrictEqual({
        hooks: { PreToolUse: [] },
        permissions: { allow: ['mcp__dungeonmaster__discover'], deny: [] },
        model: 'opus',
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {permissions.allow: string} => safeParse fails', () => {
      const result = testbedClaudeSettingsContract.safeParse({ permissions: { allow: 'x' } });

      expect(result.success).toBe(false);
    });

    it('INVALID: {a JSON array} => safeParse fails', () => {
      const result = testbedClaudeSettingsContract.safeParse([]);

      expect(result.success).toBe(false);
    });
  });
});
