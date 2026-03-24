import { pendingRequestContract } from './pending-request-contract';
import { PendingRequestStub } from './pending-request.stub';

describe('pendingRequestContract', () => {
  describe('valid values', () => {
    it('VALID: {method, url, timestampMs} => parses successfully', () => {
      const pending = PendingRequestStub();

      const parsed = pendingRequestContract.parse(pending);

      expect(parsed.method).toBe('GET');
      expect(parsed.url).toBe('http://test.local/api/guilds');
      expect(parsed.timestampMs).toBe(1700000000000);
    });

    it('VALID: {with requestBody} => parses optional field', () => {
      const pending = PendingRequestStub({ requestBody: '{"name":"test"}' });

      const parsed = pendingRequestContract.parse(pending);

      expect(parsed.requestBody).toBe('{"name":"test"}');
    });
  });

  describe('invalid values', () => {
    it('INVALID_METHOD: {method: number} => throws validation error', () => {
      expect(() => {
        return pendingRequestContract.parse({
          method: 123 as never,
          url: '/api/test',
          timestampMs: 1000,
        });
      }).toThrow(/Expected string/u);
    });

    it('INVALID_TIMESTAMP: {timestampMs: -1} => throws validation error', () => {
      expect(() => {
        return pendingRequestContract.parse({
          method: 'GET',
          url: '/api/test',
          timestampMs: -1,
        });
      }).toThrow(/Number must be greater than or equal to 0/u);
    });
  });
});
