import { monitorStateContract } from './monitor-state-contract';
import { MonitorStateStub } from './monitor-state.stub';
import { SessionIdStub, StepIdStub } from '@dungeonmaster/shared/contracts';
import { TimerIdStub } from '../timer-id/timer-id.stub';
import { StreamSignalStub } from '../stream-signal/stream-signal.stub';
import { TimedOutFlagStub } from '../timed-out-flag/timed-out-flag.stub';

describe('monitorStateContract', () => {
  describe('valid states', () => {
    it('VALID: {all null initial state} => parses successfully', () => {
      const result = monitorStateContract.parse({
        sessionId: null,
        signal: null,
        timedOut: false,
        timerId: null,
      });

      expect(result).toStrictEqual({
        sessionId: null,
        signal: null,
        timedOut: false,
        timerId: null,
      });
    });

    it('VALID: {with sessionId} => parses successfully', () => {
      const sessionId = SessionIdStub();
      const result = monitorStateContract.parse({
        sessionId,
        signal: null,
        timedOut: false,
        timerId: null,
      });

      expect(result).toStrictEqual({
        sessionId,
        signal: null,
        timedOut: false,
        timerId: null,
      });
    });

    it('VALID: {with signal complete} => parses successfully', () => {
      const stepId = StepIdStub();
      const signal = StreamSignalStub({ stepId });
      const result = monitorStateContract.parse({
        sessionId: null,
        signal,
        timedOut: false,
        timerId: null,
      });

      expect(result).toStrictEqual({
        sessionId: null,
        signal,
        timedOut: false,
        timerId: null,
      });
    });

    it('VALID: {timedOut true} => parses successfully', () => {
      const result = monitorStateContract.parse({
        sessionId: null,
        signal: null,
        timedOut: true,
        timerId: null,
      });

      expect(result).toStrictEqual({
        sessionId: null,
        signal: null,
        timedOut: true,
        timerId: null,
      });
    });

    it('VALID: {with timerId} => parses successfully', () => {
      const timerId = TimerIdStub();
      const result = monitorStateContract.parse({
        sessionId: null,
        signal: null,
        timedOut: false,
        timerId,
      });

      expect(result).toStrictEqual({
        sessionId: null,
        signal: null,
        timedOut: false,
        timerId,
      });
    });

    it('VALID: {all fields populated} => parses successfully', () => {
      const sessionId = SessionIdStub();
      const stepId = StepIdStub();
      const signal = StreamSignalStub({ stepId });
      const timerId = TimerIdStub();
      const timedOut = TimedOutFlagStub({ value: true });
      const result = monitorStateContract.parse({
        sessionId,
        signal,
        timedOut,
        timerId,
      });

      expect(result).toStrictEqual({
        sessionId,
        signal,
        timedOut,
        timerId,
      });
    });

    it('VALID: stub default => returns initial state', () => {
      const result = MonitorStateStub();

      expect(result).toStrictEqual({
        sessionId: null,
        signal: null,
        timedOut: false,
        timerId: null,
      });
    });

    it('VALID: stub with overrides => returns overridden state', () => {
      const sessionId = SessionIdStub();
      const stepId = StepIdStub();
      const signal = StreamSignalStub({ stepId });
      const timerId = TimerIdStub();
      const timedOut = TimedOutFlagStub({ value: true });
      const result = MonitorStateStub({
        sessionId,
        signal,
        timedOut,
        timerId,
      });

      expect(result).toStrictEqual({
        sessionId,
        signal,
        timedOut,
        timerId,
      });
    });
  });

  describe('invalid states', () => {
    it('INVALID_TIMEDOUT: {timedOut: missing} => throws for missing timedOut', () => {
      expect(() =>
        monitorStateContract.parse({
          sessionId: null,
          signal: null,
          timerId: null,
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID_SESSIONID: {sessionId: missing} => throws for missing sessionId', () => {
      expect(() =>
        monitorStateContract.parse({
          signal: null,
          timedOut: false,
          timerId: null,
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID_SIGNAL: {signal: missing} => throws for missing signal', () => {
      expect(() =>
        monitorStateContract.parse({
          sessionId: null,
          timedOut: false,
          timerId: null,
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID_TIMEDOUT: {timedOut: string} => throws for wrong type', () => {
      expect(() =>
        monitorStateContract.parse({
          sessionId: null,
          signal: null,
          timedOut: 'false' as never,
          timerId: null,
        }),
      ).toThrow(/Expected boolean/u);
    });

    it('INVALID_SIGNAL: {signal: invalid object} => throws for invalid signal structure', () => {
      expect(() =>
        monitorStateContract.parse({
          sessionId: null,
          signal: { invalid: 'structure' },
          timedOut: false,
          timerId: null,
        }),
      ).toThrow(/invalid/iu);
    });
  });
});
