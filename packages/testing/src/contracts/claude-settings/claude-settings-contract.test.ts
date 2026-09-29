import { claudeSettingsContract } from './claude-settings-contract';
import { ClaudeSettingsStub } from './claude-settings.stub';

describe('claudeSettingsContract', () => {
  describe('valid inputs', () => {
    it('EMPTY: {} => parses with no keys', () => {
      expect(ClaudeSettingsStub()).toStrictEqual({});
    });

    it('VALID: {hooks, permissions.allow, extra key} => keeps every key', () => {
      const settings = claudeSettingsContract.parse({
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
      const result = claudeSettingsContract.safeParse({ permissions: { allow: 'x' } });

      expect(result.success).toBe(false);
    });

    it('INVALID: {a JSON array} => safeParse fails', () => {
      const result = claudeSettingsContract.safeParse([]);

      expect(result.success).toBe(false);
    });
  });
});
