import { ErrorMessageStub } from '@dungeonmaster/shared/contracts';

import { stripTimeoutNoiseTransformer } from './strip-timeout-noise-transformer';

describe('stripTimeoutNoiseTransformer', () => {
  describe('timeout patterns', () => {
    it('VALID: {message: "Exceeded timeout of 5000 ms for a test."} => returns fallback message', () => {
      const message = ErrorMessageStub({ value: 'Exceeded timeout of 5000 ms for a test.' });

      const result = stripTimeoutNoiseTransformer({ message });

      expect(result).toBe(ErrorMessageStub({ value: 'Timed out (see network log below)' }));
    });

    it('VALID: {message: "Test timeout of 10000ms exceeded."} => returns fallback message', () => {
      const message = ErrorMessageStub({ value: 'Test timeout of 10000ms exceeded.' });

      const result = stripTimeoutNoiseTransformer({ message });

      expect(result).toBe(ErrorMessageStub({ value: 'Timed out (see network log below)' }));
    });

    it('VALID: {message: thrown format} => returns fallback message', () => {
      const message = ErrorMessageStub({
        value: 'thrown: "Exceeded timeout of 5000 ms for a test."',
      });

      const result = stripTimeoutNoiseTransformer({ message });

      expect(result).toBe(ErrorMessageStub({ value: 'Timed out (see network log below)' }));
    });
  });

  describe('no timeout pattern', () => {
    it('VALID: {message: regular error} => returns original message', () => {
      const message = ErrorMessageStub({ value: 'Expected true to be false' });

      const result = stripTimeoutNoiseTransformer({ message });

      expect(result).toBe(ErrorMessageStub({ value: 'Expected true to be false' }));
    });
  });

  describe('empty after stripping', () => {
    it('VALID: {message: only whitespace after stripping} => returns fallback message', () => {
      const message = ErrorMessageStub({
        value: '  Exceeded timeout of 5000 ms for a test.  ',
      });

      const result = stripTimeoutNoiseTransformer({ message });

      expect(result).toBe(ErrorMessageStub({ value: 'Timed out (see network log below)' }));
    });
  });

  describe('mixed content', () => {
    it('VALID: {message: timeout mixed with other content} => strips timeout, keeps rest', () => {
      const message = ErrorMessageStub({
        value:
          'Error: page.waitForResponse: Test timeout of 10000ms exceeded.\nCall log: waiting for response',
      });

      const result = stripTimeoutNoiseTransformer({ message });

      expect(result).toBe(
        ErrorMessageStub({
          value: 'Error: page.waitForResponse: \nCall log: waiting for response',
        }),
      );
    });
  });
});
