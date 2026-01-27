import { streamMonitorResultContract } from './stream-monitor-result-contract';
import { StreamMonitorResultStub } from './stream-monitor-result.stub';
import { StreamSignalStub } from '../stream-signal/stream-signal.stub';
import { TimedOutFlagStub } from '../timed-out-flag/timed-out-flag.stub';
import { SessionIdStub, ExitCodeStub, StepIdStub } from '@dungeonmaster/shared/contracts';

describe('streamMonitorResultContract', () => {
  describe('valid results', () => {
    it('VALID: {complete result with session and exit} => parses successfully', () => {
      const sessionId = SessionIdStub();
      const exitCode = ExitCodeStub({ value: 0 });
      const result = streamMonitorResultContract.parse({
        sessionId,
        exitCode,
        timedOut: false,
        signal: null,
      });

      expect(result).toStrictEqual({
        sessionId,
        exitCode,
        timedOut: false,
        signal: null,
      });
    });

    it('VALID: {timed out result with null exitCode} => parses successfully', () => {
      const sessionId = SessionIdStub();
      const result = streamMonitorResultContract.parse({
        sessionId,
        exitCode: null,
        timedOut: true,
        signal: null,
      });

      expect(result).toStrictEqual({
        sessionId,
        exitCode: null,
        timedOut: true,
        signal: null,
      });
    });

    it('VALID: {result with complete signal} => parses successfully', () => {
      const sessionId = SessionIdStub();
      const exitCode = ExitCodeStub({ value: 0 });
      const stepId = StepIdStub();
      const result = streamMonitorResultContract.parse({
        sessionId,
        exitCode,
        timedOut: false,
        signal: {
          signal: 'complete',
          stepId,
          summary: 'Done',
        },
      });

      expect(result).toStrictEqual({
        sessionId,
        exitCode,
        timedOut: false,
        signal: {
          signal: 'complete',
          stepId,
          summary: 'Done',
        },
      });
    });

    it('VALID: {null sessionId} => parses successfully', () => {
      const exitCode = ExitCodeStub({ value: 1 });
      const result = streamMonitorResultContract.parse({
        sessionId: null,
        exitCode,
        timedOut: false,
        signal: null,
      });

      expect(result).toStrictEqual({
        sessionId: null,
        exitCode,
        timedOut: false,
        signal: null,
      });
    });

    it('VALID: {null exitCode and null sessionId} => parses successfully', () => {
      const result = streamMonitorResultContract.parse({
        sessionId: null,
        exitCode: null,
        timedOut: true,
        signal: null,
      });

      expect(result).toStrictEqual({
        sessionId: null,
        exitCode: null,
        timedOut: true,
        signal: null,
      });
    });

    it('VALID: {timedOut: true} => parses boolean branded type', () => {
      const sessionId = SessionIdStub();
      const result = streamMonitorResultContract.parse({
        sessionId,
        exitCode: null,
        timedOut: true,
        signal: null,
      });

      expect(result).toStrictEqual({
        sessionId,
        exitCode: null,
        timedOut: true,
        signal: null,
      });
    });
  });

  describe('stub', () => {
    it('VALID: {default stub} => returns result with all fields', () => {
      const result = StreamMonitorResultStub();

      expect(result).toStrictEqual({
        sessionId: result.sessionId,
        exitCode: result.exitCode,
        timedOut: false,
        signal: null,
      });
    });

    it('VALID: {stub with signal override} => returns result with signal', () => {
      const signal = StreamSignalStub();
      const result = StreamMonitorResultStub({ signal });

      expect(result).toStrictEqual({
        sessionId: result.sessionId,
        exitCode: result.exitCode,
        timedOut: false,
        signal,
      });
    });

    it('VALID: {stub with timedOut override} => returns timed out result', () => {
      const timedOut = TimedOutFlagStub({ value: true });
      const result = StreamMonitorResultStub({ timedOut, exitCode: null });

      expect(result).toStrictEqual({
        sessionId: result.sessionId,
        exitCode: null,
        timedOut,
        signal: null,
      });
    });
  });

  describe('invalid results', () => {
    it('INVALID_TIMEDOUT: {timedOut: missing} => throws for missing timedOut', () => {
      expect(() =>
        streamMonitorResultContract.parse({
          sessionId: SessionIdStub(),
          exitCode: ExitCodeStub({ value: 0 }),
          signal: null,
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID_TIMEDOUT: {timedOut: string} => throws for invalid timedOut type', () => {
      expect(() =>
        streamMonitorResultContract.parse({
          sessionId: SessionIdStub(),
          exitCode: ExitCodeStub({ value: 0 }),
          timedOut: 'false' as never,
          signal: null,
        }),
      ).toThrow(/Expected boolean/u);
    });

    it('INVALID_SIGNAL: {signal: invalid object} => throws for missing stepId', () => {
      expect(() =>
        streamMonitorResultContract.parse({
          sessionId: SessionIdStub(),
          exitCode: ExitCodeStub({ value: 0 }),
          timedOut: false,
          signal: { signal: 'complete' },
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID_SIGNAL: {signal: invalid enum} => throws for invalid signal type', () => {
      expect(() =>
        streamMonitorResultContract.parse({
          sessionId: SessionIdStub(),
          exitCode: ExitCodeStub({ value: 0 }),
          timedOut: false,
          signal: { signal: 'invalid-signal', stepId: StepIdStub() },
        }),
      ).toThrow(/Invalid enum value/u);
    });

    it('INVALID_SESSIONID: {sessionId: invalid type} => throws for invalid sessionId', () => {
      expect(() =>
        streamMonitorResultContract.parse({
          sessionId: 123 as never,
          exitCode: ExitCodeStub({ value: 0 }),
          timedOut: false,
          signal: null,
        }),
      ).toThrow(/Expected string/u);
    });

    it('INVALID_EXITCODE: {exitCode: invalid type} => throws for invalid exitCode', () => {
      expect(() =>
        streamMonitorResultContract.parse({
          sessionId: SessionIdStub(),
          exitCode: 'zero' as never,
          timedOut: false,
          signal: null,
        }),
      ).toThrow(/Expected number/u);
    });
  });
});
