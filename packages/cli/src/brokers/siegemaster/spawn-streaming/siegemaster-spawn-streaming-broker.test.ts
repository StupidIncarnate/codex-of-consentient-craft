import {
  ExitCodeStub,
  QuestIdStub,
  SessionIdStub,
  StepIdStub,
} from '@dungeonmaster/shared/contracts';

import { siegemasterSpawnStreamingBroker } from './siegemaster-spawn-streaming-broker';
import { siegemasterSpawnStreamingBrokerProxy } from './siegemaster-spawn-streaming-broker.proxy';
import { AgentSpawnStreamingResultStub } from '../../../contracts/agent-spawn-streaming-result/agent-spawn-streaming-result.stub';
import { StreamJsonLineStub } from '../../../contracts/stream-json-line/stream-json-line.stub';
import { StreamSignalStub } from '../../../contracts/stream-signal/stream-signal.stub';
import { TimeoutMsStub } from '../../../contracts/timeout-ms/timeout-ms.stub';

describe('siegemasterSpawnStreamingBroker', () => {
  describe('successful spawns with signal', () => {
    it('VALID: {questId, stepId, timeoutMs} => returns sessionId and exitCode with crashed false', async () => {
      const proxy = siegemasterSpawnStreamingBrokerProxy();
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
                  summary: 'Integration tests done',
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

      const result = await siegemasterSpawnStreamingBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
        stepId,
        timeoutMs: TimeoutMsStub({ value: 60000 }),
      });

      expect(result).toStrictEqual(
        AgentSpawnStreamingResultStub({
          sessionId,
          exitCode,
          signal: StreamSignalStub({ stepId, summary: 'Integration tests done' as never }),
          crashed: false as never,
          timedOut: false as never,
        }),
      );
    });

    it('VALID: {different questId} => spawns with different quest id and exits with code 0', async () => {
      const proxy = siegemasterSpawnStreamingBrokerProxy();
      const exitCode = ExitCodeStub({ value: 0 });

      proxy.setupSuccessNoSignal({ exitCode });

      const result = await siegemasterSpawnStreamingBroker({
        questId: QuestIdStub({ value: 'feature-dark-mode' }),
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

  describe('successful spawns without signal', () => {
    it('VALID: {exitCode: 0, no signal} => returns crashed false', async () => {
      const proxy = siegemasterSpawnStreamingBrokerProxy();
      const exitCode = ExitCodeStub({ value: 0 });

      proxy.setupSuccessNoSignal({ exitCode });

      const result = await siegemasterSpawnStreamingBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
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

    it('VALID: {with resumeSessionId} => returns result with exitCode 0', async () => {
      const proxy = siegemasterSpawnStreamingBrokerProxy();
      const exitCode = ExitCodeStub({ value: 0 });
      const resumeSessionId = SessionIdStub({ value: 'resume-session-123' });

      proxy.setupSuccessNoSignal({ exitCode });

      const result = await siegemasterSpawnStreamingBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
        stepId: StepIdStub(),
        resumeSessionId,
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

  describe('crash detection', () => {
    it('VALID: {exitCode: 1, no signal} => returns crashed true', async () => {
      const proxy = siegemasterSpawnStreamingBrokerProxy();
      const exitCode = ExitCodeStub({ value: 1 });

      proxy.setupCrash({ exitCode });

      const result = await siegemasterSpawnStreamingBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
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
      const proxy = siegemasterSpawnStreamingBrokerProxy();
      const exitCode = ExitCodeStub({ value: 130 });

      proxy.setupCrash({ exitCode });

      const result = await siegemasterSpawnStreamingBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
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
      const proxy = siegemasterSpawnStreamingBrokerProxy();

      proxy.setupTimeout({ exitCode: null });

      const result = await siegemasterSpawnStreamingBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
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
      const proxy = siegemasterSpawnStreamingBrokerProxy();
      const error = new Error('ENOENT: claude command not found');

      proxy.setupError({ error });

      await expect(
        siegemasterSpawnStreamingBroker({
          questId: QuestIdStub({ value: 'add-auth' }),
          stepId: StepIdStub(),
          timeoutMs: TimeoutMsStub({ value: 60000 }),
        }),
      ).rejects.toThrow('ENOENT: claude command not found');
    });

    it('ERROR: {permission denied} => rejects with permission error', async () => {
      const proxy = siegemasterSpawnStreamingBrokerProxy();
      const error = new Error('EACCES: permission denied');

      proxy.setupError({ error });

      await expect(
        siegemasterSpawnStreamingBroker({
          questId: QuestIdStub({ value: 'add-auth' }),
          stepId: StepIdStub(),
          timeoutMs: TimeoutMsStub({ value: 60000 }),
        }),
      ).rejects.toThrow('EACCES: permission denied');
    });
  });

  describe('edge cases', () => {
    it('EDGE: {questId with numbers} => spawns with numeric quest id and returns result', async () => {
      const proxy = siegemasterSpawnStreamingBrokerProxy();
      const exitCode = ExitCodeStub({ value: 0 });

      proxy.setupSuccessNoSignal({ exitCode });

      const result = await siegemasterSpawnStreamingBroker({
        questId: QuestIdStub({ value: '001-add-auth' }),
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

    it('EDGE: {questId with special characters} => spawns successfully and returns result', async () => {
      const proxy = siegemasterSpawnStreamingBrokerProxy();
      const exitCode = ExitCodeStub({ value: 0 });

      proxy.setupSuccessNoSignal({ exitCode });

      const result = await siegemasterSpawnStreamingBroker({
        questId: QuestIdStub({ value: 'feature_with-mixed_case' }),
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
