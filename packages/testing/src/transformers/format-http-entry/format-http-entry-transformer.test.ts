import { NetworkLogEntryStub } from '../../contracts/network-log-entry/network-log-entry.stub';

import { formatHttpEntryTransformer } from './format-http-entry-transformer';

describe('formatHttpEntryTransformer', () => {
  describe('successful requests', () => {
    it('VALID: {GET with status and response body} => formats with method, url, status, duration, source', () => {
      const entry = NetworkLogEntryStub({
        method: 'GET',
        url: '/api/guilds',
        status: 200,
        durationMs: 12,
        source: 'mock',
        responseBody: '[{"id":"abc","name":"Test Guild"}]',
      });

      const result = formatHttpEntryTransformer({ entry });

      expect(result).toBe(
        'GET  /api/guilds \u2192 200 (12ms) [mock]\n' +
          '  \u2192 (no body)\n' +
          '  \u2190 [{"id":"abc","name":"Test Guild"}]',
      );
    });

    it('VALID: {POST with request and response body} => formats both bodies', () => {
      const entry = NetworkLogEntryStub({
        method: 'POST',
        url: '/api/quests',
        status: 400,
        durationMs: 8,
        source: 'bypass',
        requestBody: '{"guildId":"abc-123","title":"Fix bug"}',
        responseBody: '{"error":"title and userRequest are required strings"}',
      });

      const result = formatHttpEntryTransformer({ entry });

      expect(result).toBe(
        'POST /api/quests \u2192 400 (8ms) [bypass]\n' +
          '  \u2192 {"guildId":"abc-123","title":"Fix bug"}\n' +
          '  \u2190 {"error":"title and userRequest are required strings"}',
      );
    });

    it('VALID: {only required fields} => formats with no-body placeholders and unknown status', () => {
      const entry = NetworkLogEntryStub({
        method: 'GET',
        url: '/api/sessions',
        source: 'browser',
      });

      const result = formatHttpEntryTransformer({ entry });

      expect(result).toBe(
        'GET  /api/sessions \u2192 ??? [browser]\n  \u2192 (no body)\n  \u2190 (no body)',
      );
    });
  });

  describe('error requests', () => {
    it('VALID: {entry with error} => formats with error symbol', () => {
      const entry = NetworkLogEntryStub({
        method: 'GET',
        url: '/api/sessions',
        source: 'browser',
        error: 'net::ERR_CONNECTION_REFUSED',
      });

      const result = formatHttpEntryTransformer({ entry });

      expect(result).toBe('GET  /api/sessions \u2192 \u2717 net::ERR_CONNECTION_REFUSED');
    });
  });

  describe('URL normalization', () => {
    it('VALID: {absolute URL with localhost port} => strips localhost prefix', () => {
      const entry = NetworkLogEntryStub({
        method: 'GET',
        url: 'http://localhost:4700/api/guilds',
        status: 200,
        durationMs: 5,
        source: 'mock',
      });

      const result = formatHttpEntryTransformer({ entry });

      expect(result).toBe(
        'GET  /api/guilds \u2192 200 (5ms) [mock]\n' +
          '  \u2192 (no body)\n' +
          '  \u2190 (no body)',
      );
    });

    it('VALID: {absolute URL without port} => strips localhost prefix', () => {
      const entry = NetworkLogEntryStub({
        method: 'GET',
        url: 'http://localhost/api/guilds',
        status: 200,
        durationMs: 3,
        source: 'browser',
      });

      const result = formatHttpEntryTransformer({ entry });

      expect(result).toBe(
        'GET  /api/guilds \u2192 200 (3ms) [browser]\n' +
          '  \u2192 (no body)\n' +
          '  \u2190 (no body)',
      );
    });

    it('VALID: {https localhost URL} => strips https localhost prefix', () => {
      const entry = NetworkLogEntryStub({
        method: 'GET',
        url: 'https://localhost:8443/api/guilds',
        status: 200,
        durationMs: 7,
        source: 'mock',
      });

      const result = formatHttpEntryTransformer({ entry });

      expect(result).toBe(
        'GET  /api/guilds \u2192 200 (7ms) [mock]\n' +
          '  \u2192 (no body)\n' +
          '  \u2190 (no body)',
      );
    });
  });
});
