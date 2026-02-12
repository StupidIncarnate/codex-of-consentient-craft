import { ExitCodeStub } from '@dungeonmaster/shared/contracts';

import { TimeoutMsStub } from '../../../contracts/timeout-ms/timeout-ms.stub';

import { agentStreamMonitorBroker } from './agent-stream-monitor-broker';
import { agentStreamMonitorBrokerProxy } from './agent-stream-monitor-broker.proxy';

const STEP_ID = 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b';
const SESSION_ID = '9c4d8f1c-3e38-48c9-bdec-22b61883b473';
const ALT_SESSION_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const SUMMARY_DONE = 'Done';
const SUMMARY_PARTIAL = 'Partial';
const SUMMARY_FINAL = 'Final';

const SIGNAL_COMPLETE = 'complete' as const;
const SIGNAL_PARTIAL = 'partially-complete' as const;

const makeSignalLine = ({
  signal,
  stepId,
  summary,
}: {
  signal: typeof SIGNAL_COMPLETE | typeof SIGNAL_PARTIAL;
  stepId: typeof STEP_ID;
  summary: typeof SUMMARY_DONE | typeof SUMMARY_PARTIAL | typeof SUMMARY_FINAL;
}) =>
  JSON.stringify({
    type: 'assistant',
    message: {
      content: [
        {
          type: 'tool_use',
          name: 'mcp__dungeonmaster__signal-back',
          input: { signal, stepId, summary },
        },
      ],
    },
  });

const makeSessionIdLine = ({
  sessionId,
}: {
  sessionId: typeof SESSION_ID | typeof ALT_SESSION_ID;
}) => JSON.stringify({ session_id: sessionId });

const makeTextLine = ({ text }: { text: string }) =>
  JSON.stringify({
    type: 'assistant',
    message: {
      content: [{ type: 'text', text }],
    },
  });

describe('agentStreamMonitorBroker', () => {
  describe('signal extraction', () => {
    it('VALID: {stream with signal} => returns extracted signal', async () => {
      const proxy = agentStreamMonitorBrokerProxy();
      const signalLine = makeSignalLine({
        signal: SIGNAL_COMPLETE,
        stepId: STEP_ID,
        summary: SUMMARY_DONE,
      });
      const { mockProcess } = proxy.setupStreamAndExit({
        lines: [signalLine],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      const result = await agentStreamMonitorBroker({
        stdout: undefined as never,
        process: mockProcess as never,
        timeoutMs: TimeoutMsStub({ value: 60000 }),
      });

      expect(result).toStrictEqual({
        sessionId: null,
        exitCode: 0,
        signal: { signal: SIGNAL_COMPLETE, stepId: STEP_ID, summary: SUMMARY_DONE },
        crashed: false,
        timedOut: false,
        capturedOutput: [],
      });
    });
  });

  describe('session ID tracking', () => {
    it('VALID: {stream with session_id} => returns extracted sessionId', async () => {
      const proxy = agentStreamMonitorBrokerProxy();
      const sessionLine = makeSessionIdLine({ sessionId: SESSION_ID });
      const { mockProcess } = proxy.setupStreamAndExit({
        lines: [sessionLine],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      const result = await agentStreamMonitorBroker({
        stdout: undefined as never,
        process: mockProcess as never,
        timeoutMs: TimeoutMsStub({ value: 60000 }),
      });

      expect(result).toStrictEqual({
        sessionId: SESSION_ID,
        exitCode: 0,
        signal: null,
        crashed: false,
        timedOut: false,
        capturedOutput: [],
      });
    });

    it('VALID: {stream with multiple session_ids} => returns first sessionId only', async () => {
      const proxy = agentStreamMonitorBrokerProxy();
      const sessionLine1 = makeSessionIdLine({ sessionId: SESSION_ID });
      const sessionLine2 = makeSessionIdLine({ sessionId: ALT_SESSION_ID });
      const { mockProcess } = proxy.setupStreamAndExit({
        lines: [sessionLine1, sessionLine2],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      const result = await agentStreamMonitorBroker({
        stdout: undefined as never,
        process: mockProcess as never,
        timeoutMs: TimeoutMsStub({ value: 60000 }),
      });

      expect(result).toStrictEqual({
        sessionId: SESSION_ID,
        exitCode: 0,
        signal: null,
        crashed: false,
        timedOut: false,
        capturedOutput: [],
      });
    });
  });

  describe('timeout handling', () => {
    it('VALID: {process exceeds timeout} => kills process and returns timedOut', async () => {
      jest.useFakeTimers();
      const proxy = agentStreamMonitorBrokerProxy();
      const { mockProcess } = proxy.setupStreamAndExitOnKill({
        lines: [],
        exitCode: null,
      });

      const resultPromise = agentStreamMonitorBroker({
        stdout: undefined as never,
        process: mockProcess as never,
        timeoutMs: TimeoutMsStub({ value: 5000 }),
      });

      await jest.advanceTimersByTimeAsync(5000);

      const result = await resultPromise;
      jest.useRealTimers();

      expect(result).toStrictEqual({
        sessionId: null,
        exitCode: null,
        signal: null,
        crashed: false,
        timedOut: true,
        capturedOutput: [],
      });
      expect(mockProcess.kill).toHaveBeenCalledTimes(1);
    });
  });

  describe('crash detection', () => {
    it('VALID: {non-zero exit code} => returns crashed true', async () => {
      const proxy = agentStreamMonitorBrokerProxy();
      const { mockProcess } = proxy.setupStreamAndExit({
        lines: [],
        exitCode: ExitCodeStub({ value: 1 }),
      });

      const result = await agentStreamMonitorBroker({
        stdout: undefined as never,
        process: mockProcess as never,
        timeoutMs: TimeoutMsStub({ value: 60000 }),
      });

      expect(result).toStrictEqual({
        sessionId: null,
        exitCode: 1,
        signal: null,
        crashed: true,
        timedOut: false,
        capturedOutput: [],
      });
    });

    it('VALID: {exit code 130 SIGINT} => returns crashed true', async () => {
      const proxy = agentStreamMonitorBrokerProxy();
      const { mockProcess } = proxy.setupStreamAndExit({
        lines: [],
        exitCode: ExitCodeStub({ value: 130 }),
      });

      const result = await agentStreamMonitorBroker({
        stdout: undefined as never,
        process: mockProcess as never,
        timeoutMs: TimeoutMsStub({ value: 60000 }),
      });

      expect(result).toStrictEqual({
        sessionId: null,
        exitCode: 130,
        signal: null,
        crashed: true,
        timedOut: false,
        capturedOutput: [],
      });
    });
  });

  describe('clean exit', () => {
    it('VALID: {exit code 0, no signal} => returns signal null', async () => {
      const proxy = agentStreamMonitorBrokerProxy();
      const { mockProcess } = proxy.setupStreamAndExit({
        lines: [],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      const result = await agentStreamMonitorBroker({
        stdout: undefined as never,
        process: mockProcess as never,
        timeoutMs: TimeoutMsStub({ value: 60000 }),
      });

      expect(result).toStrictEqual({
        sessionId: null,
        exitCode: 0,
        signal: null,
        crashed: false,
        timedOut: false,
        capturedOutput: [],
      });
    });
  });

  describe('edge cases', () => {
    it('EDGE: {non-JSON stdout lines} => ignores malformed lines and returns null signal', async () => {
      const proxy = agentStreamMonitorBrokerProxy();
      const { mockProcess } = proxy.setupStreamAndExit({
        lines: ['this is not JSON', 'another plain text line'],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      const result = await agentStreamMonitorBroker({
        stdout: undefined as never,
        process: mockProcess as never,
        timeoutMs: TimeoutMsStub({ value: 60000 }),
      });

      expect(result).toStrictEqual({
        sessionId: null,
        exitCode: 0,
        signal: null,
        crashed: false,
        timedOut: false,
        capturedOutput: [],
      });
    });
  });

  describe('multiple signals', () => {
    it('VALID: {stream with two signals} => returns last signal', async () => {
      const proxy = agentStreamMonitorBrokerProxy();
      const firstSignal = makeSignalLine({
        signal: SIGNAL_PARTIAL,
        stepId: STEP_ID,
        summary: SUMMARY_PARTIAL,
      });
      const lastSignal = makeSignalLine({
        signal: SIGNAL_COMPLETE,
        stepId: STEP_ID,
        summary: SUMMARY_FINAL,
      });
      const { mockProcess } = proxy.setupStreamAndExit({
        lines: [firstSignal, lastSignal],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      const result = await agentStreamMonitorBroker({
        stdout: undefined as never,
        process: mockProcess as never,
        timeoutMs: TimeoutMsStub({ value: 60000 }),
      });

      expect(result).toStrictEqual({
        sessionId: null,
        exitCode: 0,
        signal: { signal: SIGNAL_COMPLETE, stepId: STEP_ID, summary: SUMMARY_FINAL },
        crashed: false,
        timedOut: false,
        capturedOutput: [],
      });
    });
  });

  describe('output capture', () => {
    it('VALID: {stream with text content} => captures text in capturedOutput', async () => {
      const proxy = agentStreamMonitorBrokerProxy();
      const textLine1 = makeTextLine({ text: 'Creating file utils.ts' });
      const textLine2 = makeTextLine({ text: 'Writing test cases' });
      const { mockProcess } = proxy.setupStreamAndExit({
        lines: [textLine1, textLine2],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      const result = await agentStreamMonitorBroker({
        stdout: undefined as never,
        process: mockProcess as never,
        timeoutMs: TimeoutMsStub({ value: 60000 }),
      });

      expect(result).toStrictEqual({
        sessionId: null,
        exitCode: 0,
        signal: null,
        crashed: false,
        timedOut: false,
        capturedOutput: ['Creating file utils.ts', 'Writing test cases'],
      });
    });

    it('VALID: {stream with mixed text and signal lines} => captures only text content', async () => {
      const proxy = agentStreamMonitorBrokerProxy();
      const textLine = makeTextLine({ text: 'Processing step' });
      const signalLine = makeSignalLine({
        signal: SIGNAL_COMPLETE,
        stepId: STEP_ID,
        summary: SUMMARY_DONE,
      });
      const { mockProcess } = proxy.setupStreamAndExit({
        lines: [textLine, signalLine],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      const result = await agentStreamMonitorBroker({
        stdout: undefined as never,
        process: mockProcess as never,
        timeoutMs: TimeoutMsStub({ value: 60000 }),
      });

      expect(result).toStrictEqual({
        sessionId: null,
        exitCode: 0,
        signal: { signal: SIGNAL_COMPLETE, stepId: STEP_ID, summary: SUMMARY_DONE },
        crashed: false,
        timedOut: false,
        capturedOutput: ['Processing step'],
      });
    });

    it('EMPTY: {no text lines in stream} => returns empty capturedOutput', async () => {
      const proxy = agentStreamMonitorBrokerProxy();
      const { mockProcess } = proxy.setupStreamAndExit({
        lines: [],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      const result = await agentStreamMonitorBroker({
        stdout: undefined as never,
        process: mockProcess as never,
        timeoutMs: TimeoutMsStub({ value: 60000 }),
      });

      expect(result).toStrictEqual({
        sessionId: null,
        exitCode: 0,
        signal: null,
        crashed: false,
        timedOut: false,
        capturedOutput: [],
      });
    });
  });
});
