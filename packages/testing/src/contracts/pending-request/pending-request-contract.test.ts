import { pendingRequestContract } from './pending-request-contract';
import { PendingRequestStub } from './pending-request.stub';

describe('pendingRequestContract', () => {
  describe('valid values', () => {
    it('VALID: {method, url, timestampMs} => parses successfully', () => {
      const pending = PendingRequestStub();

      const parsed = pendingRequestContract.parse(pending);

      expect(parsed).toStrictEqual({
        method: 'GET',
        url: 'http://test.local/api/guilds',
        timestampMs: 1700000000000,
      });
    });

    it('VALID: {with requestBody} => parses optional field', () => {
      const pending = PendingRequestStub({ requestBody: '{"name":"test"}' });

      const parsed = pendingRequestContract.parse(pending);

      expect(parsed.requestBody).toBe('{"name":"test"}');
    });
  });

  describe('invalid values', () => {
    it('INVALID: {method: number} => throws validation error', () => {
      expect(() => {
        return pendingRequestContract.parse({
          method: 123,
          url: '/api/test',
          timestampMs: 1000,
        });
      }).toThrow(/expected string/u);
    });

    it('INVALID: {timestampMs: -1} => throws validation error', () => {
      expect(() => {
        return pendingRequestContract.parse({
          method: 'GET',
          url: '/api/test',
          timestampMs: -1,
        });
      }).toThrow(/expected number to be >=0/u);
    });
  });
});
