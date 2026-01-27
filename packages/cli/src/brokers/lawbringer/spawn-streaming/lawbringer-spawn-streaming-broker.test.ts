import { ExitCodeStub, SessionIdStub, StepIdStub } from '@dungeonmaster/shared/contracts';

import { lawbringerSpawnStreamingBroker } from './lawbringer-spawn-streaming-broker';
import { lawbringerSpawnStreamingBrokerProxy } from './lawbringer-spawn-streaming-broker.proxy';
import { FilePairWorkUnitStub } from '../../../contracts/file-pair-work-unit/file-pair-work-unit.stub';
import { TimeoutMsStub } from '../../../contracts/timeout-ms/timeout-ms.stub';
import { AgentSpawnStreamingResultStub } from '../../../contracts/agent-spawn-streaming-result/agent-spawn-streaming-result.stub';
import { StreamSignalStub } from '../../../contracts/stream-signal/stream-signal.stub';
import { StreamJsonLineStub } from '../../../contracts/stream-json-line/stream-json-line.stub';
import { lawbringerPromptStatics } from '../../../statics/lawbringer-prompt/lawbringer-prompt-statics';

describe('lawbringerSpawnStreamingBroker', () => {
  describe('successful spawns with signal', () => {
    it('VALID: {workUnit, stepId, timeoutMs} => returns sessionId and exitCode with crashed false', async () => {
      const proxy = lawbringerSpawnStreamingBrokerProxy();
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
                  summary: 'Code review passed',
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

      const result = await lawbringerSpawnStreamingBroker({
        workUnit: FilePairWorkUnitStub(),
        stepId,
        timeoutMs: TimeoutMsStub({ value: 60000 }),
      });

      expect(result).toStrictEqual(
        AgentSpawnStreamingResultStub({
          sessionId,
          exitCode,
          signal: StreamSignalStub({ stepId, summary: 'Code review passed' as never }),
          crashed: false as never,
          timedOut: false as never,
        }),
      );
    });

    it('VALID: {with resumeSessionId} => spawns with resume flag', async () => {
      const proxy = lawbringerSpawnStreamingBrokerProxy();
      const exitCode = ExitCodeStub({ value: 0 });
      const resumeSessionId = SessionIdStub({ value: 'resume-session-123' });
      const workUnit = FilePairWorkUnitStub();

      proxy.setupSuccessNoSignal({ exitCode });

      await lawbringerSpawnStreamingBroker({
        workUnit,
        stepId: StepIdStub(),
        resumeSessionId,
        timeoutMs: TimeoutMsStub({ value: 60000 }),
      });

      // Build the expected prompt
      const reviewContext = `Implementation file: ${workUnit.implPath}\nTest file: ${workUnit.testPath}`;
      const expectedPrompt = lawbringerPromptStatics.prompt.template.replace(
        lawbringerPromptStatics.prompt.placeholders.arguments,
        reviewContext,
      );

      expect(proxy.getSpawnedArgs()).toStrictEqual([
        '-p',
        expectedPrompt,
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
      const proxy = lawbringerSpawnStreamingBrokerProxy();
      const exitCode = ExitCodeStub({ value: 0 });

      proxy.setupSuccessNoSignal({ exitCode });

      const result = await lawbringerSpawnStreamingBroker({
        workUnit: FilePairWorkUnitStub(),
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
      const proxy = lawbringerSpawnStreamingBrokerProxy();
      const exitCode = ExitCodeStub({ value: 0 });
      const workUnit = FilePairWorkUnitStub();

      proxy.setupSuccessNoSignal({ exitCode });

      await lawbringerSpawnStreamingBroker({
        workUnit,
        stepId: StepIdStub(),
        timeoutMs: TimeoutMsStub({ value: 60000 }),
      });

      // Build the expected prompt
      const reviewContext = `Implementation file: ${workUnit.implPath}\nTest file: ${workUnit.testPath}`;
      const expectedPrompt = lawbringerPromptStatics.prompt.template.replace(
        lawbringerPromptStatics.prompt.placeholders.arguments,
        reviewContext,
      );

      expect(proxy.getSpawnedArgs()).toStrictEqual([
        '-p',
        expectedPrompt,
        '--output-format',
        'stream-json',
        '--verbose',
      ]);
    });
  });

  describe('crash detection', () => {
    it('VALID: {exitCode: 1, no signal} => returns crashed true', async () => {
      const proxy = lawbringerSpawnStreamingBrokerProxy();
      const exitCode = ExitCodeStub({ value: 1 });

      proxy.setupCrash({ exitCode });

      const result = await lawbringerSpawnStreamingBroker({
        workUnit: FilePairWorkUnitStub(),
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
      const proxy = lawbringerSpawnStreamingBrokerProxy();
      const exitCode = ExitCodeStub({ value: 130 });

      proxy.setupCrash({ exitCode });

      const result = await lawbringerSpawnStreamingBroker({
        workUnit: FilePairWorkUnitStub(),
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
      const proxy = lawbringerSpawnStreamingBrokerProxy();
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
                  summary: 'Review complete before exit',
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

      const result = await lawbringerSpawnStreamingBroker({
        workUnit: FilePairWorkUnitStub(),
        stepId,
        timeoutMs: TimeoutMsStub({ value: 60000 }),
      });

      expect(result).toStrictEqual(
        AgentSpawnStreamingResultStub({
          sessionId,
          exitCode,
          signal: StreamSignalStub({ stepId, summary: 'Review complete before exit' as never }),
          crashed: false as never,
          timedOut: false as never,
        }),
      );
    });
  });

  describe('timeout detection', () => {
    it('VALID: {timedOut: true, exitCode: null} => returns crashed false', async () => {
      const proxy = lawbringerSpawnStreamingBrokerProxy();

      proxy.setupTimeout({ exitCode: null });

      const result = await lawbringerSpawnStreamingBroker({
        workUnit: FilePairWorkUnitStub(),
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
      const proxy = lawbringerSpawnStreamingBrokerProxy();
      const error = new Error('ENOENT: claude command not found');

      proxy.setupError({ error });

      await expect(
        lawbringerSpawnStreamingBroker({
          workUnit: FilePairWorkUnitStub(),
          stepId: StepIdStub(),
          timeoutMs: TimeoutMsStub({ value: 60000 }),
        }),
      ).rejects.toThrow('ENOENT: claude command not found');
    });

    it('ERROR: {permission denied} => rejects with permission error', async () => {
      const proxy = lawbringerSpawnStreamingBrokerProxy();
      const error = new Error('EACCES: permission denied');

      proxy.setupError({ error });

      await expect(
        lawbringerSpawnStreamingBroker({
          workUnit: FilePairWorkUnitStub(),
          stepId: StepIdStub(),
          timeoutMs: TimeoutMsStub({ value: 60000 }),
        }),
      ).rejects.toThrow('EACCES: permission denied');
    });
  });

  describe('edge cases', () => {
    it('EDGE: {file paths with spaces} => spawns with full prompt and returns result', async () => {
      const proxy = lawbringerSpawnStreamingBrokerProxy();
      const exitCode = ExitCodeStub({ value: 0 });

      proxy.setupSuccessNoSignal({ exitCode });

      const result = await lawbringerSpawnStreamingBroker({
        workUnit: FilePairWorkUnitStub({
          implPath: '/project/my code/broker.ts',
          testPath: '/project/my code/broker.test.ts',
        }),
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

    it('EDGE: {file paths with special characters} => spawns successfully and returns result', async () => {
      const proxy = lawbringerSpawnStreamingBrokerProxy();
      const exitCode = ExitCodeStub({ value: 0 });

      proxy.setupSuccessNoSignal({ exitCode });

      const result = await lawbringerSpawnStreamingBroker({
        workUnit: FilePairWorkUnitStub({
          implPath: '/project/src/@types/user-contract.ts',
          testPath: '/project/src/@types/user-contract.test.ts',
        }),
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
