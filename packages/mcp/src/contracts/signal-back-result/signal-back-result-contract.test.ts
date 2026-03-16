import { signalBackResultContract } from './signal-back-result-contract';
import { SignalBackResultStub } from './signal-back-result.stub';
import { SignalBackInputStub } from '../signal-back-input/signal-back-input.stub';

describe('signalBackResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {success: true, signal: complete} => parses successfully', () => {
      const signal = SignalBackInputStub({ signal: 'complete', summary: 'Done' });
      const input = SignalBackResultStub({ success: true, signal });

      const result = signalBackResultContract.parse(input);

      expect(result).toStrictEqual({
        success: true,
        signal: {
          signal: 'complete',
          summary: 'Done',
        },
      });
    });

    it('VALID: {success: true, signal: failed} => parses failed signal', () => {
      const signal = SignalBackInputStub({
        signal: 'failed',
        summary: 'Tests failing in user-fetch-broker',
      });
      const input = SignalBackResultStub({ success: true, signal });

      const result = signalBackResultContract.parse(input);

      expect(result).toStrictEqual({
        success: true,
        signal: {
          signal: 'failed',
          summary: 'Tests failing in user-fetch-broker',
        },
      });
    });

    it('VALID: {success: false, signal: complete} => parses with false success', () => {
      const signal = SignalBackInputStub({ signal: 'complete', summary: 'Done' });

      const result = signalBackResultContract.parse({
        success: false,
        signal,
      });

      expect(result).toStrictEqual({
        success: false,
        signal: {
          signal: 'complete',
          summary: 'Done',
        },
      });
    });

    it('VALID: {default stub values} => parses with defaults', () => {
      const input = SignalBackResultStub();

      const result = signalBackResultContract.parse(input);

      expect(result).toStrictEqual({
        success: true,
        signal: {
          signal: 'complete',
          summary: 'Step completed successfully',
        },
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_SUCCESS: {success: "yes"} => throws validation error', () => {
      expect(() => {
        signalBackResultContract.parse({
          success: 'yes',
          signal: SignalBackInputStub(),
        });
      }).toThrow(/Expected boolean/u);
    });

    it('INVALID_SIGNAL: {signal: null} => throws validation error', () => {
      expect(() => {
        signalBackResultContract.parse({
          success: true,
          signal: null,
        });
      }).toThrow(/Expected object/u);
    });

    it('INVALID_SIGNAL: {signal: missing} => throws validation error', () => {
      expect(() => {
        signalBackResultContract.parse({
          success: true,
        });
      }).toThrow(/Required/u);
    });

    it('INVALID_SUCCESS: {success: missing} => throws validation error', () => {
      expect(() => {
        signalBackResultContract.parse({
          signal: SignalBackInputStub(),
        });
      }).toThrow(/Required/u);
    });
  });
});
