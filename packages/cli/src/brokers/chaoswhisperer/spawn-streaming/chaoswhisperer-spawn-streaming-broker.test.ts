import { chaoswhispererSpawnStreamingBroker } from './chaoswhisperer-spawn-streaming-broker';
import { chaoswhispererSpawnStreamingBrokerProxy } from './chaoswhisperer-spawn-streaming-broker.proxy';
import { StreamJsonLineStub } from '../../../contracts/stream-json-line/stream-json-line.stub';
import {
  UserInputStub,
  ExitCodeStub,
  StepIdStub,
  SessionIdStub,
} from '@dungeonmaster/shared/contracts';
import { UuidStub } from '../../../contracts/uuid/uuid.stub';

describe('chaoswhispererSpawnStreamingBroker()', () => {
  describe('successful spawn with signal', () => {
    it('VALID: {userInput, signal in stream} => returns result with signal', async () => {
      const proxy = chaoswhispererSpawnStreamingBrokerProxy();
      const uuid = UuidStub();
      const stepId = StepIdStub({ value: uuid });
      proxy.setupUuid({ uuid });

      const signalLine = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: {
            content: [
              {
                type: 'tool_use',
                name: 'mcp__dungeonmaster__signal-back',
                input: {
                  signal: 'complete',
                  stepId,
                  summary: 'Quest created',
                },
              },
            ],
          },
        }),
      });
      proxy.setupSuccessWithSignal({
        exitCode: ExitCodeStub({ value: 0 }),
        lines: [signalLine],
      });

      const result = await chaoswhispererSpawnStreamingBroker({
        userInput: UserInputStub({ value: 'I need auth' }),
      });

      expect(result.signal).toStrictEqual({
        signal: 'complete',
        stepId,
        summary: 'Quest created',
      });
      expect(result.exitCode).toBe(0);
    });
  });

  describe('spawn without signal', () => {
    it('VALID: {userInput, no signal} => returns result with null signal', async () => {
      const proxy = chaoswhispererSpawnStreamingBrokerProxy();
      const uuid = UuidStub();
      proxy.setupUuid({ uuid });
      proxy.setupSuccessNoSignal({ exitCode: ExitCodeStub({ value: 0 }) });

      const result = await chaoswhispererSpawnStreamingBroker({
        userInput: UserInputStub({ value: 'I need auth' }),
      });

      expect(result.signal).toBeNull();
      expect(result.exitCode).toBe(0);
    });
  });

  describe('prompt construction', () => {
    it('VALID: {userInput} => passes prompt to spawn adapter', async () => {
      const proxy = chaoswhispererSpawnStreamingBrokerProxy();
      const uuid = UuidStub();
      proxy.setupUuid({ uuid });
      proxy.setupSuccessNoSignal({ exitCode: ExitCodeStub({ value: 0 }) });

      await chaoswhispererSpawnStreamingBroker({
        userInput: UserInputStub({ value: 'Build a login page' }),
      });

      const spawnedArgs = proxy.getSpawnedArgs();

      expect(spawnedArgs).not.toBeNull();
    });
  });

  describe('error handling', () => {
    it('ERROR: {spawn error} => rejects with error', async () => {
      const proxy = chaoswhispererSpawnStreamingBrokerProxy();
      const uuid = UuidStub();
      proxy.setupUuid({ uuid });
      proxy.setupError({ error: new Error('Spawn failed') });

      await expect(
        chaoswhispererSpawnStreamingBroker({
          userInput: UserInputStub({ value: 'test' }),
        }),
      ).rejects.toThrow(/Spawn failed/u);
    });
  });

  describe('resume session', () => {
    it('VALID: {userInput, resumeSessionId} => passes --resume flag to spawn', async () => {
      const proxy = chaoswhispererSpawnStreamingBrokerProxy();
      const uuid = UuidStub();
      proxy.setupUuid({ uuid });
      proxy.setupSuccessNoSignal({ exitCode: ExitCodeStub({ value: 0 }) });

      const resumeSessionId = SessionIdStub({ value: 'previous-session-123' });

      await chaoswhispererSpawnStreamingBroker({
        userInput: UserInputStub({ value: 'Continue with auth' }),
        resumeSessionId,
      });

      const spawnedArgs = proxy.getSpawnedArgs() as readonly unknown[];
      const resumeFlagIndex = spawnedArgs.indexOf('--resume');

      expect(resumeFlagIndex).toBeGreaterThan(-1);
      expect(spawnedArgs[resumeFlagIndex + 1]).toStrictEqual(resumeSessionId);
    });

    it('VALID: {userInput, no resumeSessionId} => does not include --resume flag', async () => {
      const proxy = chaoswhispererSpawnStreamingBrokerProxy();
      const uuid = UuidStub();
      proxy.setupUuid({ uuid });
      proxy.setupSuccessNoSignal({ exitCode: ExitCodeStub({ value: 0 }) });

      await chaoswhispererSpawnStreamingBroker({
        userInput: UserInputStub({ value: 'New quest' }),
      });

      const spawnedArgs = proxy.getSpawnedArgs() as readonly unknown[];
      const resumeFlagIndex = spawnedArgs.indexOf('--resume');

      expect(resumeFlagIndex).toBe(-1);
    });
  });
});
