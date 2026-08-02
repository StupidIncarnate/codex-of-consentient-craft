import { errorFormatReasonTransformer } from './error-format-reason-transformer';

describe('errorFormatReasonTransformer', () => {
  describe('Error instances', () => {
    it('VALID: {error: Error with no cause} => returns the message alone', () => {
      const error = new Error('load failed');

      const result = errorFormatReasonTransformer({ error });

      expect(result).toBe('load failed');
    });

    it('VALID: {error: Error with an Error cause} => appends the cause message', () => {
      const error = new Error('load failed', { cause: new Error('ENOENT') });

      const result = errorFormatReasonTransformer({ error });

      expect(result).toBe('load failed | cause: ENOENT');
    });

    it('VALID: {error: Error with a non-Error cause} => appends the JSON-stringified cause', () => {
      const error = new Error('load failed', { cause: { code: 'ENOENT' } });

      const result = errorFormatReasonTransformer({ error });

      expect(result).toBe('load failed | cause: {"code":"ENOENT"}');
    });
  });

  describe('non-Error values', () => {
    it('VALID: {error: a plain string} => returns String(error)', () => {
      const result = errorFormatReasonTransformer({ error: 'raw failure string' });

      expect(result).toBe('raw failure string');
    });

    it('EMPTY: {error: undefined} => returns "undefined"', () => {
      const result = errorFormatReasonTransformer({ error: undefined });

      expect(result).toBe('undefined');
    });
  });
});
