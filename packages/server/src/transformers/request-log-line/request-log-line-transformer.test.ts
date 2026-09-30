import { requestLogLineTransformer } from './request-log-line-transformer';

describe('requestLogLineTransformer', () => {
  describe('level by status', () => {
    it('VALID: {status: 200, detail: null} => info line with method, path, status, duration', () => {
      const result = requestLogLineTransformer({
        method: 'GET',
        path: '/api/guilds',
        status: 200,
        durationMs: 12,
        detail: null,
      });

      expect(result).toBe('[http] info GET /api/guilds 200 12ms');
    });

    it('VALID: {status: 302} => info line', () => {
      const result = requestLogLineTransformer({
        method: 'GET',
        path: '/',
        status: 302,
        durationMs: 0,
        detail: null,
      });

      expect(result).toBe('[http] info GET / 302 0ms');
    });

    it('VALID: {status: 404} => warn line', () => {
      const result = requestLogLineTransformer({
        method: 'POST',
        path: '/api/nope',
        status: 404,
        durationMs: 3,
        detail: null,
      });

      expect(result).toBe('[http] warn POST /api/nope 404 3ms');
    });

    it('VALID: {status: 500, detail: body} => error line carrying the body', () => {
      const result = requestLogLineTransformer({
        method: 'GET',
        path: '/api/guilds',
        status: 500,
        durationMs: 4,
        detail: '{"error":"boom"}',
      });

      expect(result).toBe('[http] error GET /api/guilds 500 4ms: {"error":"boom"}');
    });

    it('VALID: {status: 501, detail: null} => error line with no detail', () => {
      const result = requestLogLineTransformer({
        method: 'DELETE',
        path: '/api/x',
        status: 501,
        durationMs: 1,
        detail: null,
      });

      expect(result).toBe('[http] error DELETE /api/x 501 1ms');
    });
  });

  describe('detail shaping', () => {
    it('VALID: {detail: multi-line} => flattens it onto the one line', () => {
      const result = requestLogLineTransformer({
        method: 'GET',
        path: '/api/guilds',
        status: 500,
        durationMs: 4,
        detail: 'Error: boom\n    at handler (a.ts:1:1)\n',
      });

      expect(result).toBe(
        '[http] error GET /api/guilds 500 4ms: Error: boom at handler (a.ts:1:1)',
      );
    });

    it('EMPTY: {detail: ""} => no detail suffix', () => {
      const result = requestLogLineTransformer({
        method: 'GET',
        path: '/api/guilds',
        status: 500,
        durationMs: 4,
        detail: '',
      });

      expect(result).toBe('[http] error GET /api/guilds 500 4ms');
    });
  });
});
