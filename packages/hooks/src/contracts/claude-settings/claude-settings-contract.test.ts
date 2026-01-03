import { claudeSettingsContract } from './claude-settings-contract';
import { ClaudeSettingsStub } from './claude-settings.stub';

describe('claudeSettingsContract', () => {
  describe('parse()', () => {
    it('VALID: valid settings with hooks => parses successfully', () => {
      const input = ClaudeSettingsStub();

      const result = claudeSettingsContract.parse(input);

      expect(result).toStrictEqual(input);
    });

    it('VALID: empty settings => parses successfully', () => {
      const input = ClaudeSettingsStub({ hooks: undefined });

      const result = claudeSettingsContract.parse(input);

      expect(result.hooks).toBeUndefined();
    });

    it('VALID: settings with other properties => preserves them', () => {
      const input = ClaudeSettingsStub({
        hooks: {
          PreToolUse: [
            {
              hooks: [{ type: 'command', command: 'test-command' }],
            },
          ],
        },
        tools: { someTool: 'value' },
        env: { NODE_ENV: 'test' },
      });

      const result = claudeSettingsContract.parse(input);

      expect(result).toStrictEqual(input);
    });

    it('VALID: hooks without matcher => parses successfully', () => {
      const input = ClaudeSettingsStub({
        hooks: {
          PreToolUse: [
            {
              hooks: [{ type: 'command', command: 'test-command' }],
            },
          ],
        },
      });

      const result = claudeSettingsContract.parse(input);

      expect(result).toStrictEqual(input);
    });
  });
});
