import { childProcessSpawnStreamJsonAdapter } from './child-process-spawn-stream-json-adapter';
import { childProcessSpawnStreamJsonAdapterProxy } from './child-process-spawn-stream-json-adapter.proxy';
import { RepoRootCwdStub, SessionIdStub } from '@dungeonmaster/shared/contracts';
import { ClaudeModelStub } from '../../../contracts/claude-model/claude-model.stub';
import { PromptTextStub } from '../../../contracts/prompt-text/prompt-text.stub';
import { spawnedOptionsSnapshotTransformer } from '../../../transformers/spawned-options-snapshot/spawned-options-snapshot-transformer';

describe('childProcessSpawnStreamJsonAdapter', () => {
  describe('without resumeSessionId', () => {
    it('VALID: {prompt: "Hello", cwd: repo root, model: sonnet} => spawns claude with stream-json output, --model, and inline --settings from .claude/settings.json', () => {
      const proxy = childProcessSpawnStreamJsonAdapterProxy();
      const mockChildProcess = proxy.setupSpawn();

      const result = childProcessSpawnStreamJsonAdapter({
        prompt: PromptTextStub({ value: 'Hello' }),
        cwd: RepoRootCwdStub({ value: '/repo' }),
        model: ClaudeModelStub({ value: 'sonnet' }),
      });

      expect(result).toStrictEqual({
        process: mockChildProcess,
        stdout: mockChildProcess.stdout,
      });
      expect(proxy.getSpawnedCommand()).toBe('claude');
      expect(proxy.getSpawnedArgs()).toStrictEqual([
        '-p',
        'Hello',
        '--output-format',
        'stream-json',
        '--verbose',
        '--model',
        'sonnet',
        '--chrome',
        '--settings',
        '{"hooks":{}}',
      ]);
    });
  });

  describe('with resumeSessionId', () => {
    it('VALID: {prompt: "Hello", cwd: repo root, resumeSessionId: "abc-123", model: opus} => spawns with --model then resume flag after --settings', () => {
      const proxy = childProcessSpawnStreamJsonAdapterProxy();
      const mockChildProcess = proxy.setupSpawn();

      const result = childProcessSpawnStreamJsonAdapter({
        prompt: PromptTextStub({ value: 'Hello' }),
        cwd: RepoRootCwdStub({ value: '/repo' }),
        resumeSessionId: SessionIdStub({ value: 'abc-123' }),
        model: ClaudeModelStub({ value: 'opus' }),
      });

      expect(result).toStrictEqual({
        process: mockChildProcess,
        stdout: mockChildProcess.stdout,
      });
      expect(proxy.getSpawnedArgs()).toStrictEqual([
        '-p',
        'Hello',
        '--output-format',
        'stream-json',
        '--verbose',
        '--model',
        'opus',
        '--chrome',
        '--settings',
        '{"hooks":{}}',
        '--resume',
        'abc-123',
      ]);
    });
  });

  describe('settings file not found', () => {
    it('VALID: {cwd: repo root, settings file missing, model: haiku} => spawns without --settings flag', () => {
      const proxy = childProcessSpawnStreamJsonAdapterProxy();
      proxy.setupSettingsNotFound();
      proxy.setupSpawn();

      childProcessSpawnStreamJsonAdapter({
        prompt: PromptTextStub({ value: 'Hello' }),
        cwd: RepoRootCwdStub({ value: '/repo' }),
        model: ClaudeModelStub({ value: 'haiku' }),
      });

      expect(proxy.getSpawnedArgs()).toStrictEqual([
        '-p',
        'Hello',
        '--output-format',
        'stream-json',
        '--verbose',
        '--model',
        'haiku',
        '--chrome',
      ]);
    });

    it('VALID: {cwd omitted, model: haiku} => skips settings discovery entirely (no --settings flag)', () => {
      const proxy = childProcessSpawnStreamJsonAdapterProxy();
      proxy.setupSpawn();

      childProcessSpawnStreamJsonAdapter({
        prompt: PromptTextStub({ value: 'Hello' }),
        model: ClaudeModelStub({ value: 'haiku' }),
      });

      expect(proxy.getSpawnedArgs()).toStrictEqual([
        '-p',
        'Hello',
        '--output-format',
        'stream-json',
        '--verbose',
        '--model',
        'haiku',
        '--chrome',
      ]);
    });
  });

  describe('cwd parameter', () => {
    it('VALID: {cwd provided} => passes cwd to spawn options', () => {
      const proxy = childProcessSpawnStreamJsonAdapterProxy();
      proxy.setupSpawn();

      childProcessSpawnStreamJsonAdapter({
        prompt: PromptTextStub({ value: 'Hello' }),
        cwd: RepoRootCwdStub({ value: '/custom/path' }),
        model: ClaudeModelStub({ value: 'sonnet' }),
      });

      const options = spawnedOptionsSnapshotTransformer({ rawOptions: proxy.getSpawnedOptions() });

      expect(options.cwd).toBe('/custom/path');
    });

    it('VALID: {cwd omitted} => does not pass cwd to spawn options', () => {
      const proxy = childProcessSpawnStreamJsonAdapterProxy();
      proxy.setupSpawn();

      childProcessSpawnStreamJsonAdapter({
        prompt: PromptTextStub({ value: 'Hello' }),
        model: ClaudeModelStub({ value: 'sonnet' }),
      });

      const options = spawnedOptionsSnapshotTransformer({ rawOptions: proxy.getSpawnedOptions() });

      expect(options.cwd).toBe(undefined);
    });
  });

  describe('env passthrough', () => {
    it('VALID: {prompt: "Hello"} => passes a copy of process.env to spawn options', () => {
      const proxy = childProcessSpawnStreamJsonAdapterProxy();
      proxy.setupSpawn();

      childProcessSpawnStreamJsonAdapter({
        prompt: PromptTextStub({ value: 'Hello' }),
        model: ClaudeModelStub({ value: 'sonnet' }),
      });

      const options = spawnedOptionsSnapshotTransformer({ rawOptions: proxy.getSpawnedOptions() });

      expect(options.env).toStrictEqual({
        ...process.env,
        CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS: '0',
      });
    });

    it('VALID: {disableToolSearch: true} => sets ENABLE_TOOL_SEARCH=false in spawn env', () => {
      const proxy = childProcessSpawnStreamJsonAdapterProxy();
      proxy.setupSpawn();

      childProcessSpawnStreamJsonAdapter({
        prompt: PromptTextStub({ value: 'Hello' }),
        model: ClaudeModelStub({ value: 'haiku' }),
        disableToolSearch: true,
      });

      const options = spawnedOptionsSnapshotTransformer({ rawOptions: proxy.getSpawnedOptions() });

      expect(options.env).toStrictEqual({
        ...process.env,
        CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS: '0',
        ENABLE_TOOL_SEARCH: 'false',
      });
    });

    it('VALID: {disableToolSearch: false} => omits ENABLE_TOOL_SEARCH from spawn env', () => {
      const proxy = childProcessSpawnStreamJsonAdapterProxy();
      proxy.setupSpawn();

      childProcessSpawnStreamJsonAdapter({
        prompt: PromptTextStub({ value: 'Hello' }),
        model: ClaudeModelStub({ value: 'sonnet' }),
        disableToolSearch: false,
      });

      const options = spawnedOptionsSnapshotTransformer({ rawOptions: proxy.getSpawnedOptions() });

      expect(options.env).toStrictEqual({
        ...process.env,
        CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS: '0',
      });
    });
  });

  describe('background-task wait ceiling', () => {
    // Print mode terminates a session's background tasks 600s after the final turn by
    // default, which cuts an agent off mid-`npm run ward`. '0' means wait indefinitely, and
    // it has to ride the SPAWN so an end-user install gets it without exporting anything.
    it('VALID: {prompt: "Hello", model: sonnet} => spawn env sets CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS to "0"', () => {
      const proxy = childProcessSpawnStreamJsonAdapterProxy();
      proxy.setupSpawn();

      childProcessSpawnStreamJsonAdapter({
        prompt: PromptTextStub({ value: 'Hello' }),
        model: ClaudeModelStub({ value: 'sonnet' }),
      });

      const options = spawnedOptionsSnapshotTransformer({ rawOptions: proxy.getSpawnedOptions() });

      expect(options.env?.CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS).toBe('0');
    });
  });

  describe('hooks stripping for smoketest spawns', () => {
    it('VALID: {disableToolSearch: true, settings has hooks} => --settings JSON has hooks stripped', () => {
      const proxy = childProcessSpawnStreamJsonAdapterProxy();
      proxy.setupSettingsJson({
        json: '{"hooks":{"SessionStart":[{"hooks":[{"type":"command","command":"echo hi"}]}]},"permissions":{"allow":["Bash"]}}',
      });
      proxy.setupSpawn();

      childProcessSpawnStreamJsonAdapter({
        prompt: PromptTextStub({ value: 'Hello' }),
        cwd: RepoRootCwdStub({ value: '/repo' }),
        model: ClaudeModelStub({ value: 'haiku' }),
        disableToolSearch: true,
      });

      expect(proxy.getSpawnedArgs()).toStrictEqual([
        '-p',
        'Hello',
        '--output-format',
        'stream-json',
        '--verbose',
        '--model',
        'haiku',
        '--chrome',
        '--settings',
        '{"permissions":{"allow":["Bash"]}}',
      ]);
    });

    it('VALID: {disableToolSearch: false, settings has hooks} => --settings JSON retains hooks verbatim', () => {
      const proxy = childProcessSpawnStreamJsonAdapterProxy();
      proxy.setupSettingsJson({
        json: '{"hooks":{"SessionStart":[{"hooks":[{"type":"command","command":"echo hi"}]}]},"permissions":{"allow":["Bash"]}}',
      });
      proxy.setupSpawn();

      childProcessSpawnStreamJsonAdapter({
        prompt: PromptTextStub({ value: 'Hello' }),
        cwd: RepoRootCwdStub({ value: '/repo' }),
        model: ClaudeModelStub({ value: 'sonnet' }),
        disableToolSearch: false,
      });

      expect(proxy.getSpawnedArgs()).toStrictEqual([
        '-p',
        'Hello',
        '--output-format',
        'stream-json',
        '--verbose',
        '--model',
        'sonnet',
        '--chrome',
        '--settings',
        '{"hooks":{"SessionStart":[{"hooks":[{"type":"command","command":"echo hi"}]}]},"permissions":{"allow":["Bash"]}}',
      ]);
    });

    it('VALID: {disableToolSearch: true, settings is malformed JSON} => passes original string through without throwing', () => {
      const proxy = childProcessSpawnStreamJsonAdapterProxy();
      proxy.setupSettingsJson({ json: '{not valid json' });
      proxy.setupSpawn();

      childProcessSpawnStreamJsonAdapter({
        prompt: PromptTextStub({ value: 'Hello' }),
        cwd: RepoRootCwdStub({ value: '/repo' }),
        model: ClaudeModelStub({ value: 'haiku' }),
        disableToolSearch: true,
      });

      expect(proxy.getSpawnedArgs()).toStrictEqual([
        '-p',
        'Hello',
        '--output-format',
        'stream-json',
        '--verbose',
        '--model',
        'haiku',
        '--chrome',
        '--settings',
        '{not valid json',
      ]);
    });
  });

  describe('chrome browser integration', () => {
    it('VALID: {prompt: "Hello", model: sonnet} => spawns with --chrome so the session attaches the Claude-in-Chrome MCP', () => {
      const proxy = childProcessSpawnStreamJsonAdapterProxy();
      proxy.setupSpawn();

      childProcessSpawnStreamJsonAdapter({
        prompt: PromptTextStub({ value: 'Hello' }),
        model: ClaudeModelStub({ value: 'sonnet' }),
      });

      expect(proxy.getSpawnedArgs()).toStrictEqual([
        '-p',
        'Hello',
        '--output-format',
        'stream-json',
        '--verbose',
        '--model',
        'sonnet',
        '--chrome',
      ]);
    });
  });

  describe('prompt carrying an absolute image path', () => {
    it('VALID: {prompt carrying an absolute image path} => -p value is the prompt verbatim, path intact', () => {
      const proxy = childProcessSpawnStreamJsonAdapterProxy();
      proxy.setupSpawn();

      const imagePath = '/home/user/.dungeonmaster/guilds/g1/quests/q1/images/2f6d.png';
      const prompt = PromptTextStub({
        value: `compare ![Pasted Image 1](${imagePath}) with the current one`,
      });

      childProcessSpawnStreamJsonAdapter({
        prompt,
        model: ClaudeModelStub({ value: 'sonnet' }),
      });

      expect(proxy.getSpawnedArgs()).toStrictEqual([
        '-p',
        'compare ![Pasted Image 1](/home/user/.dungeonmaster/guilds/g1/quests/q1/images/2f6d.png) with the current one',
        '--output-format',
        'stream-json',
        '--verbose',
        '--model',
        'sonnet',
        '--chrome',
      ]);
    });
  });

  describe('stdinMode parameter', () => {
    it('VALID: {stdinMode: "ignore"} => passes ignore as stdio[0]', () => {
      const proxy = childProcessSpawnStreamJsonAdapterProxy();
      proxy.setupSpawn();

      childProcessSpawnStreamJsonAdapter({
        prompt: PromptTextStub({ value: 'Hello' }),
        stdinMode: 'ignore',
        model: ClaudeModelStub({ value: 'sonnet' }),
      });

      const options = spawnedOptionsSnapshotTransformer({ rawOptions: proxy.getSpawnedOptions() });

      expect(options.stdio).toStrictEqual(['ignore', 'pipe', 'inherit']);
    });

    it('VALID: {stdinMode omitted} => defaults to inherit as stdio[0]', () => {
      const proxy = childProcessSpawnStreamJsonAdapterProxy();
      proxy.setupSpawn();

      childProcessSpawnStreamJsonAdapter({
        prompt: PromptTextStub({ value: 'Hello' }),
        model: ClaudeModelStub({ value: 'sonnet' }),
      });

      const options = spawnedOptionsSnapshotTransformer({ rawOptions: proxy.getSpawnedOptions() });

      expect(options.stdio).toStrictEqual(['inherit', 'pipe', 'inherit']);
    });
  });
});
