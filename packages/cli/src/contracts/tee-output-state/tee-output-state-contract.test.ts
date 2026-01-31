import { teeOutputStateContract } from './tee-output-state-contract';
import { TeeOutputStateStub } from './tee-output-state.stub';
import { SessionIdStub, StepIdStub } from '@dungeonmaster/shared/contracts';
import { StreamSignalStub } from '../stream-signal/stream-signal.stub';

describe('teeOutputStateContract', () => {
  describe('valid states', () => {
    it('VALID: {sessionId, signal, lastOutputEndedWithNewline} => parses successfully', () => {
      const sessionId = SessionIdStub();
      const stepId = StepIdStub();
      const signal = StreamSignalStub({ stepId });

      const result = teeOutputStateContract.parse({
        sessionId,
        signal,
        lastOutputEndedWithNewline: true,
      });

      expect(result).toStrictEqual({
        sessionId,
        signal,
        lastOutputEndedWithNewline: true,
      });
    });

    it('VALID: {default stub} => returns default values', () => {
      const result = TeeOutputStateStub();

      expect(result.sessionId).not.toBeNull();
      expect(result.signal).not.toBeNull();
      expect(result.lastOutputEndedWithNewline).toBe(true);
    });

    it('VALID: {all null values except boolean} => parses successfully', () => {
      const result = teeOutputStateContract.parse({
        sessionId: null,
        signal: null,
        lastOutputEndedWithNewline: false,
      });

      expect(result).toStrictEqual({
        sessionId: null,
        signal: null,
        lastOutputEndedWithNewline: false,
      });
    });

    it('VALID: {sessionId null, signal set} => parses successfully', () => {
      const stepId = StepIdStub();
      const signal = StreamSignalStub({ stepId });

      const result = TeeOutputStateStub({
        sessionId: null,
        signal,
      });

      expect(result).toStrictEqual({
        sessionId: null,
        signal,
        lastOutputEndedWithNewline: true,
      });
    });

    it('VALID: {sessionId set, signal null} => parses successfully', () => {
      const sessionId = SessionIdStub();

      const result = TeeOutputStateStub({
        sessionId,
        signal: null,
      });

      expect(result).toStrictEqual({
        sessionId,
        signal: null,
        lastOutputEndedWithNewline: true,
      });
    });

    it('VALID: {lastOutputEndedWithNewline false} => parses successfully', () => {
      const result = TeeOutputStateStub({
        lastOutputEndedWithNewline: false,
      });

      expect(result.lastOutputEndedWithNewline).toBe(false);
    });
  });

  describe('invalid states', () => {
    it('INVALID_SESSION_ID: {sessionId: empty string} => throws validation error', () => {
      expect(() => {
        teeOutputStateContract.parse({
          sessionId: '',
          signal: null,
          lastOutputEndedWithNewline: true,
        });
      }).toThrow(/String must contain at least 1 character/u);
    });

    it('INVALID_SIGNAL: {signal: invalid signal type} => throws validation error', () => {
      expect(() => {
        teeOutputStateContract.parse({
          sessionId: null,
          signal: { signal: 'invalid-signal', stepId: StepIdStub() },
          lastOutputEndedWithNewline: true,
        });
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID_MULTIPLE: {missing all fields} => throws validation error', () => {
      expect(() => {
        teeOutputStateContract.parse({});
      }).toThrow(/Required/u);
    });

    it('INVALID_NEWLINE: {lastOutputEndedWithNewline: non-boolean} => throws validation error', () => {
      expect(() => {
        teeOutputStateContract.parse({
          sessionId: null,
          signal: null,
          lastOutputEndedWithNewline: 'yes' as never,
        });
      }).toThrow(/Expected boolean/u);
    });
  });
});
