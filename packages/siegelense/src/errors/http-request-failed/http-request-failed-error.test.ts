import { HttpRequestFailedError } from './http-request-failed-error';

describe('HttpRequestFailedError', () => {
  describe('constructor()', () => {
    it('VALID: {status, statusText, body, url} => creates error with formatted message and properties', () => {
      const error = new HttpRequestFailedError({
        status: 404,
        statusText: 'Not Found',
        body: '{"error":"Resource not found"}',
        url: 'http://127.0.0.1:34172/api/guilds/unknown',
      });

      expect({
        name: error.name,
        message: error.message,
        status: error.status,
        statusText: error.statusText,
        body: error.body,
        url: error.url,
      }).toStrictEqual({
        name: 'HttpRequestFailedError',
        message:
          'HTTP 404 Not Found from http://127.0.0.1:34172/api/guilds/unknown: {"error":"Resource not found"}',
        status: 404,
        statusText: 'Not Found',
        body: '{"error":"Resource not found"}',
        url: 'http://127.0.0.1:34172/api/guilds/unknown',
      });
    });

    it('VALID: {500 server error} => formats 500 error message correctly', () => {
      const error = new HttpRequestFailedError({
        status: 500,
        statusText: 'Internal Server Error',
        body: 'server exception',
        url: 'http://127.0.0.1:34172/api/fail',
      });

      expect({
        name: error.name,
        message: error.message,
        status: error.status,
        statusText: error.statusText,
        body: error.body,
        url: error.url,
      }).toStrictEqual({
        name: 'HttpRequestFailedError',
        message:
          'HTTP 500 Internal Server Error from http://127.0.0.1:34172/api/fail: server exception',
        status: 500,
        statusText: 'Internal Server Error',
        body: 'server exception',
        url: 'http://127.0.0.1:34172/api/fail',
      });
    });
  });

  describe('error inheritance', () => {
    it('VALID: error instanceof HttpRequestFailedError => returns true', () => {
      const error = new HttpRequestFailedError({
        status: 400,
        statusText: 'Bad Request',
        body: 'bad input',
        url: 'http://127.0.0.1:34172/api/test',
      });

      expect(error instanceof HttpRequestFailedError).toBe(true);
    });

    it('VALID: error instanceof Error => returns true', () => {
      const error = new HttpRequestFailedError({
        status: 400,
        statusText: 'Bad Request',
        body: 'bad input',
        url: 'http://127.0.0.1:34172/api/test',
      });

      expect(error instanceof Error).toBe(true);
    });
  });
});
