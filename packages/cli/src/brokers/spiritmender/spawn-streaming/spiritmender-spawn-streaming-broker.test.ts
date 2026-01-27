import {
  ExitCodeStub,
  SessionIdStub,
  StepIdStub,
  AbsoluteFilePathStub,
  ErrorMessageStub,
} from '@dungeonmaster/shared/contracts';

import { spiritmenderSpawnStreamingBroker } from './spiritmender-spawn-streaming-broker';
import { spiritmenderSpawnStreamingBrokerProxy } from './spiritmender-spawn-streaming-broker.proxy';
import { FileWorkUnitStub } from '../../../contracts/file-work-unit/file-work-unit.stub';
import { TimeoutMsStub } from '../../../contracts/timeout-ms/timeout-ms.stub';
import { AgentSpawnStreamingResultStub } from '../../../contracts/agent-spawn-streaming-result/agent-spawn-streaming-result.stub';
import { StreamSignalStub } from '../../../contracts/stream-signal/stream-signal.stub';
import { StreamJsonLineStub } from '../../../contracts/stream-json-line/stream-json-line.stub';

describe('spiritmenderSpawnStreamingBroker', () => {
  describe('successful spawns with signal', () => {
    it('VALID: {workUnit, stepId, timeoutMs} => returns sessionId and exitCode with crashed false', async () => {
      const proxy = spiritmenderSpawnStreamingBrokerProxy();
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
                  summary: 'Fixed all errors',
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

      const result = await spiritmenderSpawnStreamingBroker({
        workUnit: FileWorkUnitStub(),
        stepId,
        timeoutMs: TimeoutMsStub({ value: 60000 }),
      });

      expect(result).toStrictEqual(
        AgentSpawnStreamingResultStub({
          sessionId,
          exitCode,
          signal: StreamSignalStub({ stepId, summary: 'Fixed all errors' as never }),
          crashed: false as never,
          timedOut: false as never,
        }),
      );
    });

    it('VALID: {with resumeSessionId} => spawns with resume flag in args', async () => {
      const proxy = spiritmenderSpawnStreamingBrokerProxy();
      const exitCode = ExitCodeStub({ value: 0 });
      const resumeSessionId = SessionIdStub({ value: 'resume-session-123' });

      proxy.setupSuccessNoSignal({ exitCode });

      await spiritmenderSpawnStreamingBroker({
        workUnit: FileWorkUnitStub(),
        stepId: StepIdStub(),
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
      const proxy = spiritmenderSpawnStreamingBrokerProxy();
      const exitCode = ExitCodeStub({ value: 0 });

      proxy.setupSuccessNoSignal({ exitCode });

      const result = await spiritmenderSpawnStreamingBroker({
        workUnit: FileWorkUnitStub(),
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

    it('VALID: {no resumeSessionId} => spawns without resume flag in args', async () => {
      const proxy = spiritmenderSpawnStreamingBrokerProxy();
      const exitCode = ExitCodeStub({ value: 0 });

      proxy.setupSuccessNoSignal({ exitCode });

      await spiritmenderSpawnStreamingBroker({
        workUnit: FileWorkUnitStub(),
        stepId: StepIdStub(),
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
      const proxy = spiritmenderSpawnStreamingBrokerProxy();
      const exitCode = ExitCodeStub({ value: 1 });

      proxy.setupCrash({ exitCode });

      const result = await spiritmenderSpawnStreamingBroker({
        workUnit: FileWorkUnitStub(),
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
      const proxy = spiritmenderSpawnStreamingBrokerProxy();
      const exitCode = ExitCodeStub({ value: 130 });

      proxy.setupCrash({ exitCode });

      const result = await spiritmenderSpawnStreamingBroker({
        workUnit: FileWorkUnitStub(),
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
  });

  describe('timeout detection', () => {
    it('VALID: {timedOut: true, exitCode: null} => returns crashed false', async () => {
      const proxy = spiritmenderSpawnStreamingBrokerProxy();

      proxy.setupTimeout({ exitCode: null });

      const result = await spiritmenderSpawnStreamingBroker({
        workUnit: FileWorkUnitStub(),
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
      const proxy = spiritmenderSpawnStreamingBrokerProxy();
      const error = new Error('ENOENT: claude command not found');

      proxy.setupError({ error });

      await expect(
        spiritmenderSpawnStreamingBroker({
          workUnit: FileWorkUnitStub(),
          stepId: StepIdStub(),
          timeoutMs: TimeoutMsStub({ value: 60000 }),
        }),
      ).rejects.toThrow('ENOENT: claude command not found');
    });

    it('ERROR: {permission denied} => rejects with permission error', async () => {
      const proxy = spiritmenderSpawnStreamingBrokerProxy();
      const error = new Error('EACCES: permission denied');

      proxy.setupError({ error });

      await expect(
        spiritmenderSpawnStreamingBroker({
          workUnit: FileWorkUnitStub(),
          stepId: StepIdStub(),
          timeoutMs: TimeoutMsStub({ value: 60000 }),
        }),
      ).rejects.toThrow('EACCES: permission denied');
    });
  });

  describe('edge cases', () => {
    it('EDGE: {workUnit with multiple errors} => spawns with full error list and returns result', async () => {
      const proxy = spiritmenderSpawnStreamingBrokerProxy();
      const exitCode = ExitCodeStub({ value: 0 });

      proxy.setupSuccessNoSignal({ exitCode });

      const result = await spiritmenderSpawnStreamingBroker({
        workUnit: FileWorkUnitStub({
          filePath: AbsoluteFilePathStub({ value: '/src/complex.ts' }),
          errors: [
            ErrorMessageStub({ value: 'Missing return type' }),
            ErrorMessageStub({ value: 'Unused variable' }),
            ErrorMessageStub({ value: 'Type mismatch' }),
          ],
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

    it('EDGE: {special characters in error} => spawns successfully and returns result', async () => {
      const proxy = spiritmenderSpawnStreamingBrokerProxy();
      const exitCode = ExitCodeStub({ value: 0 });

      proxy.setupSuccessNoSignal({ exitCode });

      const result = await spiritmenderSpawnStreamingBroker({
        workUnit: FileWorkUnitStub({
          filePath: AbsoluteFilePathStub({ value: '/src/example.ts' }),
          errors: [
            ErrorMessageStub({
              value: "Type 'string' is not assignable to type 'number' at <T>",
            }),
          ],
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
