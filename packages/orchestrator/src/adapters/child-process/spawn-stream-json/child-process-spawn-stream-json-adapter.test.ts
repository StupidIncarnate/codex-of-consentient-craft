import { childProcessSpawnStreamJsonAdapter } from './child-process-spawn-stream-json-adapter';
import { childProcessSpawnStreamJsonAdapterProxy } from './child-process-spawn-stream-json-adapter.proxy';
import { SessionIdStub } from '@dungeonmaster/shared/contracts';
import { PromptTextStub } from '../../../contracts/prompt-text/prompt-text.stub';

describe('childProcessSpawnStreamJsonAdapter', () => {
  describe('without resumeSessionId', () => {
    it('VALID: {prompt: "Hello"} => spawns claude with stream-json output', () => {
      const proxy = childProcessSpawnStreamJsonAdapterProxy();
      const mockChildProcess = proxy.setupSpawn();

      const result = childProcessSpawnStreamJsonAdapter({
        prompt: PromptTextStub({ value: 'Hello' }),
      });

      expect(result.process).toBe(mockChildProcess);
      expect(result.stdout).toBe(mockChildProcess.stdout);
      expect(proxy.getSpawnedCommand()).toBe('claude');
      expect(proxy.getSpawnedArgs()).toStrictEqual([
        '-p',
        'Hello',
        '--output-format',
        'stream-json',
        '--verbose',
      ]);
    });
  });

  describe('with resumeSessionId', () => {
    it('VALID: {prompt: "Hello", resumeSessionId: "abc-123"} => spawns with resume flag', () => {
      const proxy = childProcessSpawnStreamJsonAdapterProxy();
      const mockChildProcess = proxy.setupSpawn();

      const result = childProcessSpawnStreamJsonAdapter({
        prompt: PromptTextStub({ value: 'Hello' }),
        resumeSessionId: SessionIdStub({ value: 'abc-123' }),
      });

      expect(result.process).toBe(mockChildProcess);
      expect(result.stdout).toBe(mockChildProcess.stdout);
      expect(proxy.getSpawnedArgs()).toStrictEqual([
        '-p',
        'Hello',
        '--output-format',
        'stream-json',
        '--verbose',
        '--resume',
        'abc-123',
      ]);
    });
  });
});
