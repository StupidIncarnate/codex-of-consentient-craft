import { teeOutputResultContract } from './tee-output-result-contract';
import { TeeOutputResultStub } from './tee-output-result.stub';
import { SessionIdStub, ExitCodeStub, StepIdStub } from '@dungeonmaster/shared/contracts';
import { StreamSignalStub } from '../stream-signal/stream-signal.stub';

describe('teeOutputResultContract', () => {
  describe('valid results', () => {
    it('VALID: {sessionId, signal, exitCode} => parses successfully', () => {
      const sessionId = SessionIdStub();
      const stepId = StepIdStub();
      const signal = StreamSignalStub({ stepId });
      const exitCode = ExitCodeStub();

      const result = teeOutputResultContract.parse({
        sessionId,
        signal,
        exitCode,
      });

      expect(result).toStrictEqual({
        sessionId,
        signal,
        exitCode,
      });
    });

    it('VALID: {default stub} => returns default values', () => {
      const result = TeeOutputResultStub();

      expect(result.sessionId).not.toBeNull();
      expect(result.signal).not.toBeNull();
      expect(result.exitCode).not.toBeNull();
    });

    it('VALID: {all null values} => parses successfully', () => {
      const result = teeOutputResultContract.parse({
        sessionId: null,
        signal: null,
        exitCode: null,
      });

      expect(result).toStrictEqual({
        sessionId: null,
        signal: null,
        exitCode: null,
      });
    });

    it('VALID: {sessionId null, others set} => parses successfully', () => {
      const stepId = StepIdStub();
      const signal = StreamSignalStub({ stepId });
      const exitCode = ExitCodeStub();

      const result = TeeOutputResultStub({
        sessionId: null,
        signal,
        exitCode,
      });

      expect(result).toStrictEqual({
        sessionId: null,
        signal,
        exitCode,
      });
    });

    it('VALID: {signal null, others set} => parses successfully', () => {
      const sessionId = SessionIdStub();
      const exitCode = ExitCodeStub();

      const result = TeeOutputResultStub({
        sessionId,
        signal: null,
        exitCode,
      });

      expect(result).toStrictEqual({
        sessionId,
        signal: null,
        exitCode,
      });
    });

    it('VALID: {exitCode null, others set} => parses successfully', () => {
      const sessionId = SessionIdStub();
      const stepId = StepIdStub();
      const signal = StreamSignalStub({ stepId });

      const result = TeeOutputResultStub({
        sessionId,
        signal,
        exitCode: null,
      });

      expect(result).toStrictEqual({
        sessionId,
        signal,
        exitCode: null,
      });
    });
  });

  describe('invalid results', () => {
    it('INVALID_SESSION_ID: {sessionId: empty string} => throws validation error', () => {
      expect(() => {
        teeOutputResultContract.parse({
          sessionId: '',
          signal: null,
          exitCode: null,
        });
      }).toThrow(/String must contain at least 1 character/u);
    });

    it('INVALID_EXIT_CODE: {exitCode: negative} => throws validation error', () => {
      expect(() => {
        teeOutputResultContract.parse({
          sessionId: null,
          signal: null,
          exitCode: -1,
        });
      }).toThrow(/Number must be greater than or equal to 0/u);
    });

    it('INVALID_EXIT_CODE: {exitCode: > 255} => throws validation error', () => {
      expect(() => {
        teeOutputResultContract.parse({
          sessionId: null,
          signal: null,
          exitCode: 256,
        });
      }).toThrow(/Number must be less than or equal to 255/u);
    });

    it('INVALID_SIGNAL: {signal: invalid signal type} => throws validation error', () => {
      expect(() => {
        teeOutputResultContract.parse({
          sessionId: null,
          signal: { signal: 'invalid-signal', stepId: StepIdStub() },
          exitCode: null,
        });
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID_MULTIPLE: {missing all fields} => throws validation error', () => {
      expect(() => {
        teeOutputResultContract.parse({});
      }).toThrow(/Required/u);
    });
  });
});
