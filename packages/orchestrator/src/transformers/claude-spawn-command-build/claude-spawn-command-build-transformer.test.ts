import { SessionIdStub } from '@dungeonmaster/shared/contracts/session-id/session-id.stub';

import { PromptTextStub } from '../../contracts/prompt-text/prompt-text.stub';
import { claudeSpawnCommandBuildTransformer } from './claude-spawn-command-build-transformer';

const SESSION_ID = '9c4d8f1c-3e38-48c9-bdec-22b61883b473';

describe('claudeSpawnCommandBuildTransformer', () => {
  describe('argv', () => {
    it('EMPTY: {no settings, no resume, no add-dir} => the seven base tokens and nothing else', () => {
      const { args } = claudeSpawnCommandBuildTransformer({
        prompt: PromptTextStub({ value: 'Hello' }),
        model: 'sonnet',
        settingsJson: '',
        disableToolSearch: false,
        baseEnv: {},
      });

      expect(args).toStrictEqual([
        '-p',
        'Hello',
        '--output-format',
        'stream-json',
        '--verbose',
        '--model',
        'sonnet',
      ]);
    });

    it('VALID: {settingsJson with hooks, disableToolSearch: false} => passes the settings verbatim', () => {
      const { args } = claudeSpawnCommandBuildTransformer({
        prompt: PromptTextStub({ value: 'Hello' }),
        model: 'opus',
        settingsJson: '{"hooks":{"SessionStart":[]},"permissions":{}}',
        disableToolSearch: false,
        baseEnv: {},
      });

      expect(args).toStrictEqual([
        '-p',
        'Hello',
        '--output-format',
        'stream-json',
        '--verbose',
        '--model',
        'opus',
        '--settings',
        '{"hooks":{"SessionStart":[]},"permissions":{}}',
      ]);
    });

    it('VALID: {settingsJson with hooks, disableToolSearch: true} => strips hooks and keeps the rest', () => {
      const { args } = claudeSpawnCommandBuildTransformer({
        prompt: PromptTextStub({ value: 'Hello' }),
        model: 'haiku',
        settingsJson: '{"hooks":{"SessionStart":[]},"permissions":{"allow":["Read"]}}',
        disableToolSearch: true,
        baseEnv: {},
      });

      expect(args).toStrictEqual([
        '-p',
        'Hello',
        '--output-format',
        'stream-json',
        '--verbose',
        '--model',
        'haiku',
        '--settings',
        '{"permissions":{"allow":["Read"]}}',
      ]);
    });

    it('ERROR: {settingsJson malformed, disableToolSearch: true} => passes the original string through', () => {
      const { args } = claudeSpawnCommandBuildTransformer({
        prompt: PromptTextStub({ value: 'Hello' }),
        model: 'haiku',
        settingsJson: '{not json',
        disableToolSearch: true,
        baseEnv: {},
      });

      expect(args).toStrictEqual([
        '-p',
        'Hello',
        '--output-format',
        'stream-json',
        '--verbose',
        '--model',
        'haiku',
        '--settings',
        '{not json',
      ]);
    });

    it('EDGE: {settingsJson is a JSON array, disableToolSearch: true} => passes it through unchanged', () => {
      const { args } = claudeSpawnCommandBuildTransformer({
        prompt: PromptTextStub({ value: 'Hello' }),
        model: 'haiku',
        settingsJson: '[1,2]',
        disableToolSearch: true,
        baseEnv: {},
      });

      expect(args).toStrictEqual([
        '-p',
        'Hello',
        '--output-format',
        'stream-json',
        '--verbose',
        '--model',
        'haiku',
        '--settings',
        '[1,2]',
      ]);
    });

    it('VALID: {resumeSessionId, addDir} => --resume then --add-dir close the argv in that order', () => {
      const { args } = claudeSpawnCommandBuildTransformer({
        prompt: PromptTextStub({ value: 'Hello' }),
        model: 'sonnet',
        settingsJson: '',
        disableToolSearch: false,
        baseEnv: {},
        resumeSessionId: SessionIdStub({ value: SESSION_ID }),
        addDir: '/quests/q-1/images',
      });

      expect(args).toStrictEqual([
        '-p',
        'Hello',
        '--output-format',
        'stream-json',
        '--verbose',
        '--model',
        'sonnet',
        '--resume',
        SESSION_ID,
        '--add-dir',
        '/quests/q-1/images',
      ]);
    });
  });

  describe('environment', () => {
    it('VALID: {baseEnv: PATH and HOME} => keeps both and pins the print-mode wait ceiling to 0', () => {
      const { env } = claudeSpawnCommandBuildTransformer({
        prompt: PromptTextStub({ value: 'Hello' }),
        model: 'sonnet',
        settingsJson: '',
        disableToolSearch: false,
        baseEnv: { PATH: '/usr/bin', HOME: '/home/agent' },
      });

      expect(env).toStrictEqual({
        PATH: '/usr/bin',
        HOME: '/home/agent',
        CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS: '0',
      });
    });

    it('EDGE: {baseEnv entry undefined} => drops it', () => {
      const { env } = claudeSpawnCommandBuildTransformer({
        prompt: PromptTextStub({ value: 'Hello' }),
        model: 'sonnet',
        settingsJson: '',
        disableToolSearch: false,
        baseEnv: { PATH: '/usr/bin', UNSET_VARIABLE: undefined },
      });

      expect(env).toStrictEqual({
        PATH: '/usr/bin',
        CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS: '0',
      });
    });

    it('EDGE: {baseEnv already carries the ceiling} => the spawn value wins', () => {
      const { env } = claudeSpawnCommandBuildTransformer({
        prompt: PromptTextStub({ value: 'Hello' }),
        model: 'sonnet',
        settingsJson: '',
        disableToolSearch: false,
        baseEnv: { CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS: '5000' },
      });

      expect(env).toStrictEqual({ CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS: '0' });
    });

    it('VALID: {disableToolSearch: true} => adds ENABLE_TOOL_SEARCH=false', () => {
      const { env } = claudeSpawnCommandBuildTransformer({
        prompt: PromptTextStub({ value: 'Hello' }),
        model: 'haiku',
        settingsJson: '',
        disableToolSearch: true,
        baseEnv: { PATH: '/usr/bin' },
      });

      expect(env).toStrictEqual({
        PATH: '/usr/bin',
        CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS: '0',
        ENABLE_TOOL_SEARCH: 'false',
      });
    });

    it('VALID: {disableToolSearch: false, baseEnv carries ENABLE_TOOL_SEARCH} => leaves the inherited value alone', () => {
      const { env } = claudeSpawnCommandBuildTransformer({
        prompt: PromptTextStub({ value: 'Hello' }),
        model: 'sonnet',
        settingsJson: '',
        disableToolSearch: false,
        baseEnv: { ENABLE_TOOL_SEARCH: 'true' },
      });

      expect(env).toStrictEqual({
        ENABLE_TOOL_SEARCH: 'true',
        CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS: '0',
      });
    });
  });
});
