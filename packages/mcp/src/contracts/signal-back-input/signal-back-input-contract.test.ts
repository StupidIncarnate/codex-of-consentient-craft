import { signalBackInputContract } from './signal-back-input-contract';
import { SignalBackInputStub } from './signal-back-input.stub';

describe('signalBackInputContract', () => {
  describe('valid inputs', () => {
    it('VALID: {signal: "complete", summary} => parses complete signal', () => {
      const input = SignalBackInputStub({
        signal: 'complete',
        summary: 'Task done',
      });

      const result = signalBackInputContract.parse(input);

      expect(result).toStrictEqual({
        signal: 'complete',
        summary: 'Task done',
      });
    });

    it('VALID: {signal: "failed", summary} => parses failed signal', () => {
      const input = SignalBackInputStub({
        signal: 'failed',
        summary: 'Tests failing in user-fetch-broker',
      });

      const result = signalBackInputContract.parse(input);

      expect(result).toStrictEqual({
        signal: 'failed',
        summary: 'Tests failing in user-fetch-broker',
      });
    });

    it('EDGE: {signal only, no summary} => parses minimal input', () => {
      const result = signalBackInputContract.parse({
        signal: 'complete',
      });

      expect(result).toStrictEqual({
        signal: 'complete',
      });
    });

    it('VALID: {default stub} => parses with defaults', () => {
      const input = SignalBackInputStub();

      const result = signalBackInputContract.parse(input);

      expect(result).toStrictEqual({
        signal: 'complete',
        summary: 'Step completed successfully',
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {signal: "unknown"} => throws validation error', () => {
      expect(() => {
        signalBackInputContract.parse({
          signal: 'unknown',
        });
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {signal: "partially-complete"} => throws validation error', () => {
      expect(() => {
        signalBackInputContract.parse({
          signal: 'partially-complete',
        });
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {signal: "needs-role-followup"} => throws validation error', () => {
      expect(() => {
        signalBackInputContract.parse({
          signal: 'needs-role-followup',
        });
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {summary: ""} => throws validation error for empty string', () => {
      expect(() => {
        signalBackInputContract.parse({
          signal: 'complete',
          summary: '',
        });
      }).toThrow(/too_small/u);
    });

    it('INVALID: {missing signal} => throws validation error', () => {
      expect(() => {
        signalBackInputContract.parse({});
      }).toThrow(/Required/u);
    });
  });
});
