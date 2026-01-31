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

    it('VALID: {userInput, no signal, exit code 0} => writes warning to stderr', async () => {
      const proxy = chaoswhispererSpawnStreamingBrokerProxy();
      const uuid = UuidStub();
      proxy.setupUuid({ uuid });
      proxy.setupSuccessNoSignal({ exitCode: ExitCodeStub({ value: 0 }) });

      await chaoswhispererSpawnStreamingBroker({
        userInput: UserInputStub({ value: 'I need auth' }),
      });

      const stderrOutput = proxy.getStderrOutput();

      expect(stderrOutput).toMatch(/Agent ended without signaling completion/u);
    });

    it('VALID: {userInput, no signal, non-zero exit code} => does not write warning to stderr', async () => {
      const proxy = chaoswhispererSpawnStreamingBrokerProxy();
      const uuid = UuidStub();
      proxy.setupUuid({ uuid });
      proxy.setupSuccessNoSignal({ exitCode: ExitCodeStub({ value: 1 }) });

      await chaoswhispererSpawnStreamingBroker({
        userInput: UserInputStub({ value: 'I need auth' }),
      });

      const stderrOutput = proxy.getStderrOutput();

      // No warning when exit code is non-zero (error already occurred)
      expect(stderrOutput).toBe('');
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

    it('VALID: {userInput, resumeSessionId} => prompt is just user answer, not full template', async () => {
      const proxy = chaoswhispererSpawnStreamingBrokerProxy();
      const uuid = UuidStub();
      proxy.setupUuid({ uuid });
      proxy.setupSuccessNoSignal({ exitCode: ExitCodeStub({ value: 0 }) });

      const resumeSessionId = SessionIdStub({ value: 'previous-session-123' });
      const userAnswer = UserInputStub({ value: 'Port 4000, yes OAuth, 24 hours' });

      await chaoswhispererSpawnStreamingBroker({
        userInput: userAnswer,
        resumeSessionId,
      });

      const spawnedPrompt = proxy.getSpawnedPrompt();

      // On resume, prompt should be JUST the user's answer, not the full template
      // The template contains "# ChaosWhisperer - BDD Architect Agent" header
      expect(spawnedPrompt).toBe(userAnswer);
    });

    it('VALID: {userInput, no resumeSessionId} => prompt contains full template', async () => {
      const proxy = chaoswhispererSpawnStreamingBrokerProxy();
      const uuid = UuidStub();
      proxy.setupUuid({ uuid });
      proxy.setupSuccessNoSignal({ exitCode: ExitCodeStub({ value: 0 }) });

      const userRequest = UserInputStub({ value: 'Build a login page' });

      await chaoswhispererSpawnStreamingBroker({
        userInput: userRequest,
      });

      const spawnedPrompt = proxy.getSpawnedPrompt();

      // On initial spawn, prompt should contain the full template with role instructions
      expect(spawnedPrompt).toMatch(/# ChaosWhisperer - BDD Architect Agent/u);
      // And should include the user's request
      expect(spawnedPrompt).toMatch(/Build a login page/u);
    });
  });
});
