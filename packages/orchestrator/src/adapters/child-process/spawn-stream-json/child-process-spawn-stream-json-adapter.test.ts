import { childProcessSpawnStreamJsonAdapter } from './child-process-spawn-stream-json-adapter';
import { childProcessSpawnStreamJsonAdapterProxy } from './child-process-spawn-stream-json-adapter.proxy';
import { SessionIdStub } from '@dungeonmaster/shared/contracts';
import { ClaudeModelStub } from '../../../contracts/claude-model/claude-model.stub';
import { PromptTextStub } from '../../../contracts/prompt-text/prompt-text.stub';

describe('childProcessSpawnStreamJsonAdapter', () => {
  describe('without resumeSessionId', () => {
    it('VALID: {prompt: "Hello", model: sonnet} => spawns claude with stream-json output, --model, and inline --settings from .claude/settings.json', () => {
      const proxy = childProcessSpawnStreamJsonAdapterProxy();
      const mockChildProcess = proxy.setupSpawn();

      const result = childProcessSpawnStreamJsonAdapter({
        prompt: PromptTextStub({ value: 'Hello' }),
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
        '--settings',
        '{"hooks":{}}',
      ]);
    });
  });

  describe('with resumeSessionId', () => {
    it('VALID: {prompt: "Hello", resumeSessionId: "abc-123", model: opus} => spawns with --model then resume flag after --settings', () => {
      const proxy = childProcessSpawnStreamJsonAdapterProxy();
      const mockChildProcess = proxy.setupSpawn();

      const result = childProcessSpawnStreamJsonAdapter({
        prompt: PromptTextStub({ value: 'Hello' }),
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
        '--settings',
        '{"hooks":{}}',
        '--resume',
        'abc-123',
      ]);
    });
  });

  describe('settings file not found', () => {
    it('VALID: {settings file missing, model: haiku} => spawns without --settings flag', () => {
      const proxy = childProcessSpawnStreamJsonAdapterProxy();
      proxy.setupSettingsNotFound();
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
      ]);
    });
  });

  describe('cwd parameter', () => {
    it('VALID: {cwd provided} => passes cwd to spawn options', () => {
      const proxy = childProcessSpawnStreamJsonAdapterProxy();
      proxy.setupSpawn();

      childProcessSpawnStreamJsonAdapter({
        prompt: PromptTextStub({ value: 'Hello' }),
        cwd: '/custom/path',
        model: ClaudeModelStub({ value: 'sonnet' }),
      });

      const options = proxy.getSpawnedOptions();

      expect(Reflect.get(options as object, 'cwd')).toBe('/custom/path');
    });

    it('VALID: {cwd omitted} => does not pass cwd to spawn options', () => {
      const proxy = childProcessSpawnStreamJsonAdapterProxy();
      proxy.setupSpawn();

      childProcessSpawnStreamJsonAdapter({
        prompt: PromptTextStub({ value: 'Hello' }),
        model: ClaudeModelStub({ value: 'sonnet' }),
      });

      const options = proxy.getSpawnedOptions();

      expect(Reflect.get(options as object, 'cwd')).toBe(undefined);
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

      const options = proxy.getSpawnedOptions();

      expect(Reflect.get(options as object, 'env')).toStrictEqual({ ...process.env });
    });

    it('VALID: {disableToolSearch: true} => sets ENABLE_TOOL_SEARCH=false in spawn env', () => {
      const proxy = childProcessSpawnStreamJsonAdapterProxy();
      proxy.setupSpawn();

      childProcessSpawnStreamJsonAdapter({
        prompt: PromptTextStub({ value: 'Hello' }),
        model: ClaudeModelStub({ value: 'haiku' }),
        disableToolSearch: true,
      });

      const options = proxy.getSpawnedOptions();

      expect(Reflect.get(options as object, 'env')).toStrictEqual({
        ...process.env,
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

      const options = proxy.getSpawnedOptions();

      expect(Reflect.get(options as object, 'env')).toStrictEqual({ ...process.env });
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
        '--settings',
        '{not valid json',
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

      const options = proxy.getSpawnedOptions();

      expect(Reflect.get(options as object, 'stdio')).toStrictEqual(['ignore', 'pipe', 'inherit']);
    });

    it('VALID: {stdinMode omitted} => defaults to inherit as stdio[0]', () => {
      const proxy = childProcessSpawnStreamJsonAdapterProxy();
      proxy.setupSpawn();

      childProcessSpawnStreamJsonAdapter({
        prompt: PromptTextStub({ value: 'Hello' }),
        model: ClaudeModelStub({ value: 'sonnet' }),
      });

      const options = proxy.getSpawnedOptions();

      expect(Reflect.get(options as object, 'stdio')).toStrictEqual(['inherit', 'pipe', 'inherit']);
    });
  });
});
