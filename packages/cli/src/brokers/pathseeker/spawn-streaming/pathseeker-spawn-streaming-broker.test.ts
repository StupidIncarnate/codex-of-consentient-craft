import { ExitCodeStub, QuestIdStub, SessionIdStub } from '@dungeonmaster/shared/contracts';

import { pathseekerSpawnStreamingBroker } from './pathseeker-spawn-streaming-broker';
import { pathseekerSpawnStreamingBrokerProxy } from './pathseeker-spawn-streaming-broker.proxy';
import { TimeoutMsStub } from '../../../contracts/timeout-ms/timeout-ms.stub';
import { AgentSpawnStreamingResultStub } from '../../../contracts/agent-spawn-streaming-result/agent-spawn-streaming-result.stub';
import { StreamSignalStub } from '../../../contracts/stream-signal/stream-signal.stub';
import { StreamJsonLineStub } from '../../../contracts/stream-json-line/stream-json-line.stub';
import { StepIdStub } from '@dungeonmaster/shared/contracts';

describe('pathseekerSpawnStreamingBroker', () => {
  describe('successful spawns with signal', () => {
    it('VALID: {questId, timeoutMs} => returns sessionId and exitCode with crashed false', async () => {
      const proxy = pathseekerSpawnStreamingBrokerProxy();
      const exitCode = ExitCodeStub({ value: 0 });
      const sessionId = SessionIdStub();
      const questId = QuestIdStub({ value: 'add-auth' });
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
                  summary: 'File mapping completed',
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

      const result = await pathseekerSpawnStreamingBroker({
        questId,
        timeoutMs: TimeoutMsStub({ value: 60000 }),
      });

      expect(result).toStrictEqual(
        AgentSpawnStreamingResultStub({
          sessionId,
          exitCode,
          signal: StreamSignalStub({ stepId, summary: 'File mapping completed' as never }),
          crashed: false as never,
          timedOut: false as never,
        }),
      );
    });

    it('VALID: {with resumeSessionId} => spawns with resume flag', async () => {
      const proxy = pathseekerSpawnStreamingBrokerProxy();
      const exitCode = ExitCodeStub({ value: 0 });
      const resumeSessionId = SessionIdStub({ value: 'resume-session-123' });
      const questId = QuestIdStub({ value: 'add-auth' });

      proxy.setupSuccessNoSignal({ exitCode });

      await pathseekerSpawnStreamingBroker({
        questId,
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
      const proxy = pathseekerSpawnStreamingBrokerProxy();
      const exitCode = ExitCodeStub({ value: 0 });
      const questId = QuestIdStub({ value: 'add-auth' });

      proxy.setupSuccessNoSignal({ exitCode });

      const result = await pathseekerSpawnStreamingBroker({
        questId,
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
      const proxy = pathseekerSpawnStreamingBrokerProxy();
      const exitCode = ExitCodeStub({ value: 0 });
      const questId = QuestIdStub({ value: 'add-auth' });

      proxy.setupSuccessNoSignal({ exitCode });

      await pathseekerSpawnStreamingBroker({
        questId,
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
      const proxy = pathseekerSpawnStreamingBrokerProxy();
      const exitCode = ExitCodeStub({ value: 1 });
      const questId = QuestIdStub({ value: 'add-auth' });

      proxy.setupCrash({ exitCode });

      const result = await pathseekerSpawnStreamingBroker({
        questId,
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
      const proxy = pathseekerSpawnStreamingBrokerProxy();
      const exitCode = ExitCodeStub({ value: 130 });
      const questId = QuestIdStub({ value: 'add-auth' });

      proxy.setupCrash({ exitCode });

      const result = await pathseekerSpawnStreamingBroker({
        questId,
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
      const proxy = pathseekerSpawnStreamingBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });

      proxy.setupTimeout({ exitCode: null });

      const result = await pathseekerSpawnStreamingBroker({
        questId,
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
      const proxy = pathseekerSpawnStreamingBrokerProxy();
      const error = new Error('ENOENT: claude command not found');
      const questId = QuestIdStub({ value: 'add-auth' });

      proxy.setupError({ error });

      await expect(
        pathseekerSpawnStreamingBroker({
          questId,
          timeoutMs: TimeoutMsStub({ value: 60000 }),
        }),
      ).rejects.toThrow(/ENOENT: claude command not found/u);
    });

    it('ERROR: {permission denied} => rejects with permission error', async () => {
      const proxy = pathseekerSpawnStreamingBrokerProxy();
      const error = new Error('EACCES: permission denied');
      const questId = QuestIdStub({ value: 'add-auth' });

      proxy.setupError({ error });

      await expect(
        pathseekerSpawnStreamingBroker({
          questId,
          timeoutMs: TimeoutMsStub({ value: 60000 }),
        }),
      ).rejects.toThrow(/EACCES: permission denied/u);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {different questId} => spawns successfully', async () => {
      const proxy = pathseekerSpawnStreamingBrokerProxy();
      const exitCode = ExitCodeStub({ value: 0 });
      const questId = QuestIdStub({ value: 'implement-auth-flow' });

      proxy.setupSuccessNoSignal({ exitCode });

      const result = await pathseekerSpawnStreamingBroker({
        questId,
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

    it('EDGE: {questId with special characters} => spawns successfully', async () => {
      const proxy = pathseekerSpawnStreamingBrokerProxy();
      const exitCode = ExitCodeStub({ value: 0 });
      const questId = QuestIdStub({ value: 'add-user-@auth' });

      proxy.setupSuccessNoSignal({ exitCode });

      const result = await pathseekerSpawnStreamingBroker({
        questId,
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
