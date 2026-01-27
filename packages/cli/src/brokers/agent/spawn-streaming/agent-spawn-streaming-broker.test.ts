import { ExitCodeStub, SessionIdStub, StepIdStub } from '@dungeonmaster/shared/contracts';
import { agentSpawnStreamingBroker } from './agent-spawn-streaming-broker';
import { agentSpawnStreamingBrokerProxy } from './agent-spawn-streaming-broker.proxy';
import { PromptTextStub } from '../../../contracts/prompt-text/prompt-text.stub';
import { TimeoutMsStub } from '../../../contracts/timeout-ms/timeout-ms.stub';
import { AgentSpawnStreamingResultStub } from '../../../contracts/agent-spawn-streaming-result/agent-spawn-streaming-result.stub';
import { StreamSignalStub } from '../../../contracts/stream-signal/stream-signal.stub';
import { StreamJsonLineStub } from '../../../contracts/stream-json-line/stream-json-line.stub';

describe('agentSpawnStreamingBroker', () => {
  describe('successful spawns with signal', () => {
    it('VALID: {prompt, stepId, timeoutMs} => returns sessionId and exitCode with crashed false', async () => {
      const proxy = agentSpawnStreamingBrokerProxy();
      const exitCode = ExitCodeStub({ value: 0 });
      const sessionId = SessionIdStub();
      const stepId = StepIdStub();
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
                  summary: 'Task done',
                },
              },
            ],
          },
        }),
      });
      const sessionLine = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'system',
          session_id: sessionId,
        }),
      });

      proxy.setupSuccessWithSignal({
        exitCode,
        lines: [sessionLine, signalLine],
      });

      const result = await agentSpawnStreamingBroker({
        prompt: PromptTextStub({ value: 'Test prompt' }),
        stepId,
        timeoutMs: TimeoutMsStub({ value: 60000 }),
      });

      expect(result).toStrictEqual(
        AgentSpawnStreamingResultStub({
          sessionId,
          exitCode,
          signal: StreamSignalStub({ stepId, summary: 'Task done' as never }),
          crashed: false as never,
          timedOut: false as never,
        }),
      );
    });

    it('VALID: {with resumeSessionId} => spawns with resume flag', async () => {
      const proxy = agentSpawnStreamingBrokerProxy();
      const exitCode = ExitCodeStub({ value: 0 });
      const resumeSessionId = SessionIdStub({ value: 'resume-session-123' });

      proxy.setupSuccessNoSignal({ exitCode });

      await agentSpawnStreamingBroker({
        prompt: PromptTextStub({ value: 'Continue task' }),
        stepId: StepIdStub(),
        resumeSessionId,
        timeoutMs: TimeoutMsStub({ value: 60000 }),
      });

      expect(proxy.getSpawnedArgs()).toStrictEqual([
        '-p',
        'Continue task',
        '--output-format',
        'stream-json',
        '--verbose',
        '--resume',
        'resume-session-123',
      ]);
    });
  });

  describe('successful spawns without signal', () => {
    it('VALID: {exitCode: 0, no signal} => returns crashed false', async () => {
      const proxy = agentSpawnStreamingBrokerProxy();
      const exitCode = ExitCodeStub({ value: 0 });

      proxy.setupSuccessNoSignal({ exitCode });

      const result = await agentSpawnStreamingBroker({
        prompt: PromptTextStub({ value: 'Test prompt' }),
        stepId: StepIdStub(),
        timeoutMs: TimeoutMsStub({ value: 60000 }),
      });

      expect(result).toStrictEqual(
        AgentSpawnStreamingResultStub({
          sessionId: null,
          exitCode,
          signal: null,
          crashed: false as never,
          timedOut: false as never,
        }),
      );
    });

    it('VALID: {no resumeSessionId} => spawns without resume flag', async () => {
      const proxy = agentSpawnStreamingBrokerProxy();
      const exitCode = ExitCodeStub({ value: 0 });

      proxy.setupSuccessNoSignal({ exitCode });

      await agentSpawnStreamingBroker({
        prompt: PromptTextStub({ value: 'Test prompt' }),
        stepId: StepIdStub(),
        timeoutMs: TimeoutMsStub({ value: 60000 }),
      });

      expect(proxy.getSpawnedArgs()).toStrictEqual([
        '-p',
        'Test prompt',
        '--output-format',
        'stream-json',
        '--verbose',
      ]);
    });
  });

  describe('crash detection', () => {
    it('VALID: {exitCode: 1, no signal} => returns crashed true', async () => {
      const proxy = agentSpawnStreamingBrokerProxy();
      const exitCode = ExitCodeStub({ value: 1 });

      proxy.setupCrash({ exitCode });

      const result = await agentSpawnStreamingBroker({
        prompt: PromptTextStub({ value: 'Test prompt' }),
        stepId: StepIdStub(),
        timeoutMs: TimeoutMsStub({ value: 60000 }),
      });

      expect(result).toStrictEqual(
        AgentSpawnStreamingResultStub({
          sessionId: null,
          exitCode,
          signal: null,
          crashed: true as never,
          timedOut: false as never,
        }),
      );
    });

    it('VALID: {exitCode: 130, no signal} => returns crashed true for SIGINT exit', async () => {
      const proxy = agentSpawnStreamingBrokerProxy();
      const exitCode = ExitCodeStub({ value: 130 });

      proxy.setupCrash({ exitCode });

      const result = await agentSpawnStreamingBroker({
        prompt: PromptTextStub({ value: 'Test prompt' }),
        stepId: StepIdStub(),
        timeoutMs: TimeoutMsStub({ value: 60000 }),
      });

      expect(result).toStrictEqual(
        AgentSpawnStreamingResultStub({
          sessionId: null,
          exitCode,
          signal: null,
          crashed: true as never,
          timedOut: false as never,
        }),
      );
    });

    it('VALID: {exitCode: non-zero, signal present} => returns crashed false', async () => {
      const proxy = agentSpawnStreamingBrokerProxy();
      const exitCode = ExitCodeStub({ value: 1 });
      const sessionId = SessionIdStub();
      const stepId = StepIdStub();
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
                  summary: 'Done before crash',
                },
              },
            ],
          },
        }),
      });
      const sessionLine = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'system',
          session_id: sessionId,
        }),
      });

      proxy.setupSuccessWithSignal({
        exitCode,
        lines: [sessionLine, signalLine],
      });

      const result = await agentSpawnStreamingBroker({
        prompt: PromptTextStub({ value: 'Test prompt' }),
        stepId,
        timeoutMs: TimeoutMsStub({ value: 60000 }),
      });

      expect(result).toStrictEqual(
        AgentSpawnStreamingResultStub({
          sessionId,
          exitCode,
          signal: StreamSignalStub({ stepId, summary: 'Done before crash' as never }),
          crashed: false as never,
          timedOut: false as never,
        }),
      );
    });
  });

  describe('timeout detection', () => {
    it('VALID: {timedOut: true, exitCode: null} => returns crashed false', async () => {
      const proxy = agentSpawnStreamingBrokerProxy();

      proxy.setupTimeout({ exitCode: null });

      const result = await agentSpawnStreamingBroker({
        prompt: PromptTextStub({ value: 'Test prompt' }),
        stepId: StepIdStub(),
        timeoutMs: TimeoutMsStub({ value: 60000 }),
      });

      expect(result).toStrictEqual(
        AgentSpawnStreamingResultStub({
          sessionId: null,
          exitCode: null,
          signal: null,
          crashed: false as never,
          timedOut: true as never,
        }),
      );
    });
  });

  describe('spawn errors', () => {
    it('ERROR: {spawn fails} => rejects with error', async () => {
      const proxy = agentSpawnStreamingBrokerProxy();
      const error = new Error('ENOENT: claude command not found');

      proxy.setupError({ error });

      await expect(
        agentSpawnStreamingBroker({
          prompt: PromptTextStub({ value: 'Test prompt' }),
          stepId: StepIdStub(),
          timeoutMs: TimeoutMsStub({ value: 60000 }),
        }),
      ).rejects.toThrow('ENOENT: claude command not found');
    });

    it('ERROR: {permission denied} => rejects with permission error', async () => {
      const proxy = agentSpawnStreamingBrokerProxy();
      const error = new Error('EACCES: permission denied');

      proxy.setupError({ error });

      await expect(
        agentSpawnStreamingBroker({
          prompt: PromptTextStub({ value: 'Test prompt' }),
          stepId: StepIdStub(),
          timeoutMs: TimeoutMsStub({ value: 60000 }),
        }),
      ).rejects.toThrow('EACCES: permission denied');
    });
  });

  describe('edge cases', () => {
    it('EDGE: {multiline prompt} => spawns with full prompt and returns result', async () => {
      const proxy = agentSpawnStreamingBrokerProxy();
      const exitCode = ExitCodeStub({ value: 0 });

      proxy.setupSuccessNoSignal({ exitCode });

      const result = await agentSpawnStreamingBroker({
        prompt: PromptTextStub({ value: 'Line 1\nLine 2\nLine 3' }),
        stepId: StepIdStub(),
        timeoutMs: TimeoutMsStub({ value: 60000 }),
      });

      expect(result).toStrictEqual(
        AgentSpawnStreamingResultStub({
          sessionId: null,
          exitCode,
          signal: null,
          crashed: false as never,
          timedOut: false as never,
        }),
      );
    });

    it('EDGE: {special characters in prompt} => spawns successfully and returns result', async () => {
      const proxy = agentSpawnStreamingBrokerProxy();
      const exitCode = ExitCodeStub({ value: 0 });

      proxy.setupSuccessNoSignal({ exitCode });

      const result = await agentSpawnStreamingBroker({
        prompt: PromptTextStub({ value: 'Prompt with "quotes" and $variables & symbols' }),
        stepId: StepIdStub(),
        timeoutMs: TimeoutMsStub({ value: 60000 }),
      });

      expect(result).toStrictEqual(
        AgentSpawnStreamingResultStub({
          sessionId: null,
          exitCode,
          signal: null,
          crashed: false as never,
          timedOut: false as never,
        }),
      );
    });
  });
});
