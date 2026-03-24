import { ErrorMessageStub } from '@dungeonmaster/shared/contracts';

import { extractNetworkLogTransformer } from './extract-network-log-transformer';

describe('extractNetworkLogTransformer', () => {
  describe('extraction', () => {
    it('VALID: {rawOutput: content between delimiters} => extracts log', () => {
      const rawOutput = ErrorMessageStub({
        value: [
          'some test output',
          '__NETWORK_LOG__',
          'GET /api/users 200 15ms',
          'POST /api/sessions 201 42ms',
          '__NETWORK_LOG_END__',
          'more output',
        ].join('\n'),
      });

      const result = extractNetworkLogTransformer({ rawOutput });

      expect(result).toBe(
        ErrorMessageStub({ value: 'GET /api/users 200 15ms\nPOST /api/sessions 201 42ms' }),
      );
    });
  });

  describe('no delimiters', () => {
    it('EMPTY: {rawOutput: no delimiters} => returns empty string', () => {
      const rawOutput = ErrorMessageStub({
        value: 'regular test output with no network log',
      });

      const result = extractNetworkLogTransformer({ rawOutput });

      expect(result).toBe(ErrorMessageStub({ value: '' }));
    });
  });

  describe('multiple blocks', () => {
    it('VALID: {rawOutput: two delimiter blocks} => returns all blocks concatenated', () => {
      const rawOutput = ErrorMessageStub({
        value: [
          '__NETWORK_LOG__',
          'GET /api/first 200',
          '__NETWORK_LOG_END__',
          'middle output',
          '__NETWORK_LOG__',
          'POST /api/second 201',
          '__NETWORK_LOG_END__',
        ].join('\n'),
      });

      const result = extractNetworkLogTransformer({ rawOutput });

      expect(result).toBe(ErrorMessageStub({ value: 'GET /api/first 200\nPOST /api/second 201' }));
    });
  });

  describe('empty content', () => {
    it('EMPTY: {rawOutput: empty between delimiters} => returns empty string', () => {
      const rawOutput = ErrorMessageStub({
        value: '__NETWORK_LOG__\n\n__NETWORK_LOG_END__',
      });

      const result = extractNetworkLogTransformer({ rawOutput });

      expect(result).toBe(ErrorMessageStub({ value: '' }));
    });
  });

  describe('whitespace handling', () => {
    it('VALID: {rawOutput: whitespace around content} => trims extracted content', () => {
      const rawOutput = ErrorMessageStub({
        value: '__NETWORK_LOG__\n  GET /api/users 200  \n__NETWORK_LOG_END__',
      });

      const result = extractNetworkLogTransformer({ rawOutput });

      expect(result).toBe(ErrorMessageStub({ value: 'GET /api/users 200' }));
    });
  });
});
