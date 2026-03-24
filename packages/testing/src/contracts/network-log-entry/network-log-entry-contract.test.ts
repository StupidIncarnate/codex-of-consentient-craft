import { networkLogEntryContract } from './network-log-entry-contract';
import { NetworkLogEntryStub } from './network-log-entry.stub';

describe('networkLogEntryContract', () => {
  describe('valid entries', () => {
    it('VALID: {method, url, status, source} => parses successfully', () => {
      const entry = NetworkLogEntryStub({
        method: 'GET',
        url: '/api/guilds',
        status: 200,
        durationMs: 12,
        source: 'mock',
      });

      const parsed = networkLogEntryContract.parse(entry);

      expect(parsed).toStrictEqual({
        method: 'GET',
        url: '/api/guilds',
        status: 200,
        durationMs: 12,
        source: 'mock',
      });
    });

    it('VALID: {all optional fields present} => parses with bodies and error', () => {
      const entry = NetworkLogEntryStub({
        method: 'POST',
        url: '/api/quests',
        status: 400,
        durationMs: 8,
        requestBody: '{"title":"Fix bug"}',
        responseBody: '{"error":"bad request"}',
        error: 'validation failed',
        source: 'bypass',
      });

      const parsed = networkLogEntryContract.parse(entry);

      expect(parsed).toStrictEqual({
        method: 'POST',
        url: '/api/quests',
        status: 400,
        durationMs: 8,
        requestBody: '{"title":"Fix bug"}',
        responseBody: '{"error":"bad request"}',
        error: 'validation failed',
        source: 'bypass',
      });
    });

    it('VALID: {only required fields} => parses without optional fields', () => {
      const parsed = networkLogEntryContract.parse({
        method: 'GET',
        url: '/api/sessions',
        source: 'browser',
      });

      expect(parsed).toStrictEqual({
        method: 'GET',
        url: '/api/sessions',
        source: 'browser',
      });
    });

    it('VALID: {source: "browser"} => parses browser source', () => {
      const entry = NetworkLogEntryStub({ source: 'browser' });

      const parsed = networkLogEntryContract.parse(entry);

      expect(parsed.source).toBe('browser');
    });
  });

  describe('invalid entries', () => {
    it('INVALID_METHOD: {method: number} => throws validation error', () => {
      expect(() => {
        return networkLogEntryContract.parse({
          method: 123 as never,
          url: '/api/guilds',
          source: 'mock',
        });
      }).toThrow(/Expected string/u);
    });

    it('INVALID_SOURCE: {source: "unknown"} => throws validation error', () => {
      expect(() => {
        return networkLogEntryContract.parse({
          method: 'GET',
          url: '/api/guilds',
          source: 'unknown',
        });
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID_MULTIPLE: {missing all fields} => throws validation error', () => {
      expect(() => {
        return networkLogEntryContract.parse({});
      }).toThrow(/Required/u);
    });

    it('INVALID_STATUS: {status: 1.5} => throws validation error', () => {
      expect(() => {
        return networkLogEntryContract.parse({
          method: 'GET',
          url: '/api/guilds',
          status: 1.5,
          source: 'mock',
        });
      }).toThrow(/Expected integer/u);
    });

    it('INVALID_DURATION: {durationMs: -1} => throws validation error', () => {
      expect(() => {
        return networkLogEntryContract.parse({
          method: 'GET',
          url: '/api/guilds',
          durationMs: -1,
          source: 'mock',
        });
      }).toThrow(/Number must be greater than or equal to 0/u);
    });
  });
});
