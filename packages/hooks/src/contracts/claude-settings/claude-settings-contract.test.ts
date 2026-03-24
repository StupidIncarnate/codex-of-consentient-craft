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

    it('VALID: settings with PostToolUse hooks => parses successfully', () => {
      const input = ClaudeSettingsStub({
        hooks: {
          PostToolUse: [
            {
              matcher: 'Write|Edit',
              hooks: [{ type: 'command', command: 'post-edit-hook' }],
            },
          ],
        },
      });

      const result = claudeSettingsContract.parse(input);

      expect(result).toStrictEqual(input);
    });

    it('VALID: PostToolUse hook without matcher => parses successfully', () => {
      const input = ClaudeSettingsStub({
        hooks: {
          PostToolUse: [
            {
              hooks: [{ type: 'command', command: 'post-tool-hook' }],
            },
          ],
        },
      });

      const result = claudeSettingsContract.parse(input);

      expect(result).toStrictEqual(input);
    });

    it('VALID: settings with permissions allow => parses successfully', () => {
      const input = ClaudeSettingsStub({
        permissions: {
          allow: ['Bash(npm run build)', 'Read'],
        },
      });

      const result = claudeSettingsContract.parse(input);

      expect(result.permissions?.allow).toStrictEqual(['Bash(npm run build)', 'Read']);
    });

    it('VALID: settings with permissions deny => parses successfully', () => {
      const input = ClaudeSettingsStub({
        permissions: {
          deny: ['Bash(rm -rf)'],
        },
      });

      const result = claudeSettingsContract.parse(input);

      expect(result.permissions?.deny).toStrictEqual(['Bash(rm -rf)']);
    });

    it('VALID: settings with both allow and deny permissions => parses successfully', () => {
      const input = ClaudeSettingsStub({
        permissions: {
          allow: ['Read'],
          deny: ['Bash(rm -rf)'],
        },
      });

      const result = claudeSettingsContract.parse(input);

      expect(result.permissions?.allow).toStrictEqual(['Read']);
      expect(result.permissions?.deny).toStrictEqual(['Bash(rm -rf)']);
    });

    it('VALID: settings with empty permissions object => parses successfully', () => {
      const input = ClaudeSettingsStub({
        permissions: {},
      });

      const result = claudeSettingsContract.parse(input);

      expect(result.permissions).toStrictEqual({});
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: hook entry without type field => throws ZodError', () => {
      expect(() =>
        claudeSettingsContract.parse({
          hooks: {
            PreToolUse: [
              {
                hooks: [{ command: 'test-command' }],
              },
            ],
          },
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID: hook entry without command field => throws ZodError', () => {
      expect(() =>
        claudeSettingsContract.parse({
          hooks: {
            PreToolUse: [
              {
                hooks: [{ type: 'command' }],
              },
            ],
          },
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID: PreToolUse entry without hooks array => throws ZodError', () => {
      expect(() =>
        claudeSettingsContract.parse({
          hooks: {
            PreToolUse: [
              {
                matcher: 'Write',
              },
            ],
          },
        }),
      ).toThrow(/Required/u);
    });
  });
});
