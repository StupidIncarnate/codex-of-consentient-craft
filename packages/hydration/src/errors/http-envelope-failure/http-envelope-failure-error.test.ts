import { HttpEnvelopeFailureError } from './http-envelope-failure-error';

describe('HttpEnvelopeFailureError', () => {
  describe('constructor()', () => {
    it('VALID: {url, status, body} => stores properties and formats message', () => {
      const error = new HttpEnvelopeFailureError({
        url: 'http://localhost:3737/api/guilds',
        status: 500,
        body: '{"error":"database unavailable"}',
      });

      expect({
        name: error.name,
        message: error.message,
        url: error.url,
        status: error.status,
        body: error.body,
      }).toStrictEqual({
        name: 'HttpEnvelopeFailureError',
        message: 'http://localhost:3737/api/guilds answered 500',
        url: 'http://localhost:3737/api/guilds',
        status: 500,
        body: '{"error":"database unavailable"}',
      });
    });
  });

  describe('error inheritance', () => {
    it('VALID: error instanceof HttpEnvelopeFailureError => returns true', () => {
      const error = new HttpEnvelopeFailureError({
        url: 'http://localhost:3737/api/guilds',
        status: 500,
        body: '{}',
      });

      expect(error instanceof HttpEnvelopeFailureError).toBe(true);
    });

    it('VALID: error instanceof Error => returns true', () => {
      const error = new HttpEnvelopeFailureError({
        url: 'http://localhost:3737/api/guilds',
        status: 500,
        body: '{}',
      });

      expect(error instanceof Error).toBe(true);
    });
  });
});
