import { agentStreamMonitorBroker } from './agent-stream-monitor-broker';
import { agentStreamMonitorBrokerProxy } from './agent-stream-monitor-broker.proxy';
import { TimeoutMsStub } from '../../../contracts/timeout-ms/timeout-ms.stub';
import { TimedOutFlagStub } from '../../../contracts/timed-out-flag/timed-out-flag.stub';
import { StreamJsonLineStub } from '../../../contracts/stream-json-line/stream-json-line.stub';
import { SessionIdStub, ExitCodeStub, StepIdStub } from '@dungeonmaster/shared/contracts';

describe('agentStreamMonitorBroker()', () => {
  describe('session ID extraction', () => {
    it('VALID: {stream with session_id} => returns extracted session ID', async () => {
      const proxy = agentStreamMonitorBrokerProxy();
      const sessionId = SessionIdStub();
      const lines = [
        StreamJsonLineStub({ value: JSON.stringify({ type: 'system', session_id: sessionId }) }),
      ];
      proxy.setupStreamWithLines({ lines });

      const processStub = proxy.returnsProcessWithExit({ exitCode: ExitCodeStub({ value: 0 }) });

      const result = await agentStreamMonitorBroker({
        stdout: jest.fn() as never,
        process: processStub,
        timeoutMs: TimeoutMsStub({ value: 60000 }),
      });

      expect(result).toStrictEqual({
        sessionId,
        exitCode: ExitCodeStub({ value: 0 }),
        timedOut: TimedOutFlagStub({ value: false }),
        signal: null,
      });
    });

    it('VALID: {stream with multiple session_id lines} => returns first session ID only', async () => {
      const proxy = agentStreamMonitorBrokerProxy();
      const firstSessionId = SessionIdStub({ value: 'first-session-id-12345' });
      const secondSessionId = SessionIdStub({ value: 'second-session-id-67890' });
      const lines = [
        StreamJsonLineStub({
          value: JSON.stringify({ type: 'system', session_id: firstSessionId }),
        }),
        StreamJsonLineStub({
          value: JSON.stringify({ type: 'system', session_id: secondSessionId }),
        }),
      ];
      proxy.setupStreamWithLines({ lines });

      const processStub = proxy.returnsProcessWithExit({ exitCode: ExitCodeStub({ value: 0 }) });

      const result = await agentStreamMonitorBroker({
        stdout: jest.fn() as never,
        process: processStub,
        timeoutMs: TimeoutMsStub({ value: 60000 }),
      });

      expect(result).toStrictEqual({
        sessionId: firstSessionId,
        exitCode: ExitCodeStub({ value: 0 }),
        timedOut: TimedOutFlagStub({ value: false }),
        signal: null,
      });
    });

    it('EMPTY: {stream with no session_id} => returns null session ID', async () => {
      const proxy = agentStreamMonitorBrokerProxy();
      proxy.setupEmptyStream();

      const processStub = proxy.returnsProcessWithExit({ exitCode: ExitCodeStub({ value: 0 }) });

      const result = await agentStreamMonitorBroker({
        stdout: jest.fn() as never,
        process: processStub,
        timeoutMs: TimeoutMsStub({ value: 60000 }),
      });

      expect(result).toStrictEqual({
        sessionId: null,
        exitCode: ExitCodeStub({ value: 0 }),
        timedOut: TimedOutFlagStub({ value: false }),
        signal: null,
      });
    });

    it('VALID: {stream with valid JSON but no session_id field} => returns null session ID', async () => {
      const proxy = agentStreamMonitorBrokerProxy();
      const lines = [
        StreamJsonLineStub({ value: JSON.stringify({ type: 'user', message: 'hello' }) }),
      ];
      proxy.setupStreamWithLines({ lines });

      const processStub = proxy.returnsProcessWithExit({ exitCode: ExitCodeStub({ value: 0 }) });

      const result = await agentStreamMonitorBroker({
        stdout: jest.fn() as never,
        process: processStub,
        timeoutMs: TimeoutMsStub({ value: 60000 }),
      });

      expect(result).toStrictEqual({
        sessionId: null,
        exitCode: ExitCodeStub({ value: 0 }),
        timedOut: TimedOutFlagStub({ value: false }),
        signal: null,
      });
    });
  });

  describe('signal extraction', () => {
    it('VALID: {stream with signal-back tool call} => returns extracted signal', async () => {
      const proxy = agentStreamMonitorBrokerProxy();
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
                  summary: 'Task completed successfully',
                },
              },
            ],
          },
        }),
      });
      proxy.setupStreamWithLines({ lines: [signalLine] });

      const processStub = proxy.returnsProcessWithExit({ exitCode: ExitCodeStub({ value: 0 }) });

      const result = await agentStreamMonitorBroker({
        stdout: jest.fn() as never,
        process: processStub,
        timeoutMs: TimeoutMsStub({ value: 60000 }),
      });

      expect(result.signal).toStrictEqual({
        signal: 'complete',
        stepId,
        summary: 'Task completed successfully',
      });
    });

    it('VALID: {stream with multiple signals} => returns first signal only', async () => {
      const proxy = agentStreamMonitorBrokerProxy();
      const stepId = StepIdStub();
      const firstSignalLine = StreamJsonLineStub({
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
                  summary: 'First signal',
                },
              },
            ],
          },
        }),
      });
      const secondSignalLine = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: {
            content: [
              {
                type: 'tool_use',
                name: 'mcp__dungeonmaster__signal-back',
                input: {
                  signal: 'partially-complete',
                  stepId,
                  progress: 'Some progress',
                  continuationPoint: 'Continue here',
                },
              },
            ],
          },
        }),
      });
      proxy.setupStreamWithLines({ lines: [firstSignalLine, secondSignalLine] });

      const processStub = proxy.returnsProcessWithExit({ exitCode: ExitCodeStub({ value: 0 }) });

      const result = await agentStreamMonitorBroker({
        stdout: jest.fn() as never,
        process: processStub,
        timeoutMs: TimeoutMsStub({ value: 60000 }),
      });

      expect(result.signal).toStrictEqual({
        signal: 'complete',
        stepId,
        summary: 'First signal',
      });
    });
  });

  describe('line parsing', () => {
    it('INVALID_LINE: {stream with invalid JSON} => continues and returns result', async () => {
      const proxy = agentStreamMonitorBrokerProxy();
      const lines = [
        StreamJsonLineStub({ value: 'not valid json' }),
        StreamJsonLineStub({ value: 'also not valid' }),
      ];
      proxy.setupStreamWithLines({ lines });

      const processStub = proxy.returnsProcessWithExit({ exitCode: ExitCodeStub({ value: 0 }) });

      const result = await agentStreamMonitorBroker({
        stdout: jest.fn() as never,
        process: processStub,
        timeoutMs: TimeoutMsStub({ value: 60000 }),
      });

      expect(result).toStrictEqual({
        sessionId: null,
        exitCode: ExitCodeStub({ value: 0 }),
        timedOut: TimedOutFlagStub({ value: false }),
        signal: null,
      });
    });
  });

  describe('process exit', () => {
    it('VALID: {process exits with code 0} => returns exit code 0', async () => {
      const proxy = agentStreamMonitorBrokerProxy();
      proxy.setupEmptyStream();

      const processStub = proxy.returnsProcessWithExit({ exitCode: ExitCodeStub({ value: 0 }) });

      const result = await agentStreamMonitorBroker({
        stdout: jest.fn() as never,
        process: processStub,
        timeoutMs: TimeoutMsStub({ value: 60000 }),
      });

      expect(result).toStrictEqual({
        sessionId: null,
        exitCode: ExitCodeStub({ value: 0 }),
        timedOut: TimedOutFlagStub({ value: false }),
        signal: null,
      });
    });

    it('VALID: {process exits with code 1} => returns exit code 1', async () => {
      const proxy = agentStreamMonitorBrokerProxy();
      proxy.setupEmptyStream();

      const processStub = proxy.returnsProcessWithExit({ exitCode: ExitCodeStub({ value: 1 }) });

      const result = await agentStreamMonitorBroker({
        stdout: jest.fn() as never,
        process: processStub,
        timeoutMs: TimeoutMsStub({ value: 60000 }),
      });

      expect(result).toStrictEqual({
        sessionId: null,
        exitCode: ExitCodeStub({ value: 1 }),
        timedOut: TimedOutFlagStub({ value: false }),
        signal: null,
      });
    });

    it('EDGE: {process exits with null code} => returns null exit code', async () => {
      const proxy = agentStreamMonitorBrokerProxy();
      proxy.setupEmptyStream();

      const processStub = proxy.returnsProcessWithNullExit();

      const result = await agentStreamMonitorBroker({
        stdout: jest.fn() as never,
        process: processStub,
        timeoutMs: TimeoutMsStub({ value: 60000 }),
      });

      expect(result).toStrictEqual({
        sessionId: null,
        exitCode: null,
        timedOut: TimedOutFlagStub({ value: false }),
        signal: null,
      });
    });
  });

  describe('process error', () => {
    it('ERROR: {process emits error} => rejects with error', async () => {
      const proxy = agentStreamMonitorBrokerProxy();
      proxy.setupEmptyStream();

      const error = new Error('Process failed');
      const processStub = proxy.returnsProcessWithError({ error });

      await expect(
        agentStreamMonitorBroker({
          stdout: jest.fn() as never,
          process: processStub,
          timeoutMs: TimeoutMsStub({ value: 60000 }),
        }),
      ).rejects.toStrictEqual(error);
    });
  });

  describe('timeout', () => {
    it('VALID: {timeout fires} => returns timedOut true', async () => {
      const proxy = agentStreamMonitorBrokerProxy();
      proxy.setupEmptyStream();
      proxy.setupTimeoutFires();

      const processStub = proxy.returnsProcessWithExitOnKill({ exitCode: null });

      const result = await agentStreamMonitorBroker({
        stdout: jest.fn() as never,
        process: processStub,
        timeoutMs: TimeoutMsStub({ value: 60000 }),
      });

      expect(result).toStrictEqual({
        sessionId: null,
        exitCode: null,
        timedOut: TimedOutFlagStub({ value: true }),
        signal: null,
      });
    });
  });
});
