import { DependencyStepStub, ExitCodeStub, SessionIdStub } from '@dungeonmaster/shared/contracts';

import { codeweaverSpawnStreamingBroker } from './codeweaver-spawn-streaming-broker';
import { codeweaverSpawnStreamingBrokerProxy } from './codeweaver-spawn-streaming-broker.proxy';
import { TimeoutMsStub } from '../../../contracts/timeout-ms/timeout-ms.stub';
import { AgentSpawnStreamingResultStub } from '../../../contracts/agent-spawn-streaming-result/agent-spawn-streaming-result.stub';
import { StreamSignalStub } from '../../../contracts/stream-signal/stream-signal.stub';
import { StreamJsonLineStub } from '../../../contracts/stream-json-line/stream-json-line.stub';

describe('codeweaverSpawnStreamingBroker', () => {
  describe('successful spawns with signal', () => {
    it('VALID: {step, timeoutMs} => returns sessionId and exitCode with crashed false', async () => {
      const proxy = codeweaverSpawnStreamingBrokerProxy();
      const exitCode = ExitCodeStub({ value: 0 });
      const sessionId = SessionIdStub();
      const step = DependencyStepStub({
        id: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
        name: 'Create user API endpoint',
      });
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
                  stepId: step.id,
                  summary: 'Step completed',
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

      const result = await codeweaverSpawnStreamingBroker({
        step,
        timeoutMs: TimeoutMsStub({ value: 60000 }),
      });

      expect(result).toStrictEqual(
        AgentSpawnStreamingResultStub({
          sessionId,
          exitCode,
          signal: StreamSignalStub({ stepId: step.id, summary: 'Step completed' as never }),
          crashed: false as never,
          timedOut: false as never,
        }),
      );
    });

    it('VALID: {with resumeSessionId} => spawns with resume flag', async () => {
      const proxy = codeweaverSpawnStreamingBrokerProxy();
      const exitCode = ExitCodeStub({ value: 0 });
      const resumeSessionId = SessionIdStub({ value: 'resume-session-123' });
      const step = DependencyStepStub();

      proxy.setupSuccessNoSignal({ exitCode });

      await codeweaverSpawnStreamingBroker({
        step,
        resumeSessionId,
        timeoutMs: TimeoutMsStub({ value: 60000 }),
      });

      expect(proxy.getSpawnedArgs()).toStrictEqual([
        '-p',
        expect.any(String),
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
      const proxy = codeweaverSpawnStreamingBrokerProxy();
      const exitCode = ExitCodeStub({ value: 0 });
      const step = DependencyStepStub();

      proxy.setupSuccessNoSignal({ exitCode });

      const result = await codeweaverSpawnStreamingBroker({
        step,
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
      const proxy = codeweaverSpawnStreamingBrokerProxy();
      const exitCode = ExitCodeStub({ value: 0 });
      const step = DependencyStepStub();

      proxy.setupSuccessNoSignal({ exitCode });

      await codeweaverSpawnStreamingBroker({
        step,
        timeoutMs: TimeoutMsStub({ value: 60000 }),
      });

      expect(proxy.getSpawnedArgs()).toStrictEqual([
        '-p',
        expect.any(String),
        '--output-format',
        'stream-json',
        '--verbose',
      ]);
    });
  });

  describe('crash detection', () => {
    it('VALID: {exitCode: 1, no signal} => returns crashed true', async () => {
      const proxy = codeweaverSpawnStreamingBrokerProxy();
      const exitCode = ExitCodeStub({ value: 1 });
      const step = DependencyStepStub();

      proxy.setupCrash({ exitCode });

      const result = await codeweaverSpawnStreamingBroker({
        step,
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
      const proxy = codeweaverSpawnStreamingBrokerProxy();
      const exitCode = ExitCodeStub({ value: 130 });
      const step = DependencyStepStub();

      proxy.setupCrash({ exitCode });

      const result = await codeweaverSpawnStreamingBroker({
        step,
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
  });

  describe('timeout detection', () => {
    it('VALID: {timedOut: true, exitCode: null} => returns crashed false', async () => {
      const proxy = codeweaverSpawnStreamingBrokerProxy();
      const step = DependencyStepStub();

      proxy.setupTimeout({ exitCode: null });

      const result = await codeweaverSpawnStreamingBroker({
        step,
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
      const proxy = codeweaverSpawnStreamingBrokerProxy();
      const error = new Error('ENOENT: claude command not found');
      const step = DependencyStepStub();

      proxy.setupError({ error });

      await expect(
        codeweaverSpawnStreamingBroker({
          step,
          timeoutMs: TimeoutMsStub({ value: 60000 }),
        }),
      ).rejects.toThrow('ENOENT: claude command not found');
    });

    it('ERROR: {permission denied} => rejects with permission error', async () => {
      const proxy = codeweaverSpawnStreamingBrokerProxy();
      const error = new Error('EACCES: permission denied');
      const step = DependencyStepStub();

      proxy.setupError({ error });

      await expect(
        codeweaverSpawnStreamingBroker({
          step,
          timeoutMs: TimeoutMsStub({ value: 60000 }),
        }),
      ).rejects.toThrow('EACCES: permission denied');
    });
  });

  describe('edge cases', () => {
    it('EDGE: {step with all fields} => spawns successfully', async () => {
      const proxy = codeweaverSpawnStreamingBrokerProxy();
      const exitCode = ExitCodeStub({ value: 0 });
      const step = DependencyStepStub({
        id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
        name: 'Complex step with all fields',
        description: 'A step with all optional fields populated',
        observablesSatisfied: ['b2c3d4e5-f6a7-4b8c-d9e0-1f2a3b4c5d6e'],
        dependsOn: ['c3d4e5f6-a7b8-4c9d-e0f1-2a3b4c5d6e7f'],
        filesToCreate: ['src/new-file.ts'],
        filesToModify: ['src/existing-file.ts'],
        status: 'in_progress',
      });

      proxy.setupSuccessNoSignal({ exitCode });

      const result = await codeweaverSpawnStreamingBroker({
        step,
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

    it('EDGE: {step with special characters} => spawns successfully', async () => {
      const proxy = codeweaverSpawnStreamingBrokerProxy();
      const exitCode = ExitCodeStub({ value: 0 });
      const step = DependencyStepStub({
        name: "Add support for @mentions, #hashtags, and $variables in user's input",
        description: 'Handle special characters properly',
      });

      proxy.setupSuccessNoSignal({ exitCode });

      const result = await codeweaverSpawnStreamingBroker({
        step,
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

    it('EDGE: {step with unicode characters} => spawns successfully', async () => {
      const proxy = codeweaverSpawnStreamingBrokerProxy();
      const exitCode = ExitCodeStub({ value: 0 });
      const step = DependencyStepStub({
        name: 'Add internationalization support',
        description: 'Support for Japanese: \u65e5\u672c\u8a9e',
      });

      proxy.setupSuccessNoSignal({ exitCode });

      const result = await codeweaverSpawnStreamingBroker({
        step,
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
