import { childProcessSpawnStreamJsonAdapter } from './child-process-spawn-stream-json-adapter';
import { childProcessSpawnStreamJsonAdapterProxy } from './child-process-spawn-stream-json-adapter.proxy';
import { SessionIdStub } from '@dungeonmaster/shared/contracts';
import { PromptTextStub } from '../../../contracts/prompt-text/prompt-text.stub';

describe('childProcessSpawnStreamJsonAdapter', () => {
  describe('without resumeSessionId', () => {
    it('VALID: {prompt: "Hello"} => spawns claude with stream-json output and inline --settings from .claude/settings.json', () => {
      const proxy = childProcessSpawnStreamJsonAdapterProxy();
      const mockChildProcess = proxy.setupSpawn();

      const result = childProcessSpawnStreamJsonAdapter({
        prompt: PromptTextStub({ value: 'Hello' }),
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
        '--settings',
        '{"hooks":{}}',
      ]);
    });
  });

  describe('with resumeSessionId', () => {
    it('VALID: {prompt: "Hello", resumeSessionId: "abc-123"} => spawns with resume flag after --settings', () => {
      const proxy = childProcessSpawnStreamJsonAdapterProxy();
      const mockChildProcess = proxy.setupSpawn();

      const result = childProcessSpawnStreamJsonAdapter({
        prompt: PromptTextStub({ value: 'Hello' }),
        resumeSessionId: SessionIdStub({ value: 'abc-123' }),
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
        '--settings',
        '{"hooks":{}}',
        '--resume',
        'abc-123',
      ]);
    });
  });

  describe('settings file not found', () => {
    it('VALID: {settings file missing} => spawns without --settings flag', () => {
      const proxy = childProcessSpawnStreamJsonAdapterProxy();
      proxy.setupSettingsNotFound();
      proxy.setupSpawn();

      childProcessSpawnStreamJsonAdapter({
        prompt: PromptTextStub({ value: 'Hello' }),
      });

      expect(proxy.getSpawnedArgs()).toStrictEqual([
        '-p',
        'Hello',
        '--output-format',
        'stream-json',
        '--verbose',
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
      });

      const options = proxy.getSpawnedOptions();

      expect(Reflect.get(options as object, 'cwd')).toBe('/custom/path');
    });

    it('VALID: {cwd omitted} => does not pass cwd to spawn options', () => {
      const proxy = childProcessSpawnStreamJsonAdapterProxy();
      proxy.setupSpawn();

      childProcessSpawnStreamJsonAdapter({
        prompt: PromptTextStub({ value: 'Hello' }),
      });

      const options = proxy.getSpawnedOptions();

      expect(Reflect.get(options as object, 'cwd')).toBe(undefined);
    });
  });

  describe('stdinMode parameter', () => {
    it('VALID: {stdinMode: "ignore"} => passes ignore as stdio[0]', () => {
      const proxy = childProcessSpawnStreamJsonAdapterProxy();
      proxy.setupSpawn();

      childProcessSpawnStreamJsonAdapter({
        prompt: PromptTextStub({ value: 'Hello' }),
        stdinMode: 'ignore',
      });

      const options = proxy.getSpawnedOptions();

      expect(Reflect.get(options as object, 'stdio')).toStrictEqual(['ignore', 'pipe', 'inherit']);
    });

    it('VALID: {stdinMode omitted} => defaults to inherit as stdio[0]', () => {
      const proxy = childProcessSpawnStreamJsonAdapterProxy();
      proxy.setupSpawn();

      childProcessSpawnStreamJsonAdapter({
        prompt: PromptTextStub({ value: 'Hello' }),
      });

      const options = proxy.getSpawnedOptions();

      expect(Reflect.get(options as object, 'stdio')).toStrictEqual(['inherit', 'pipe', 'inherit']);
    });
  });
});
