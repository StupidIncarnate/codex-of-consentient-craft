import { fetchWithStatus } from './fetch-with-status';
import { fetchWithStatusProxy } from './fetch-with-status.proxy';

const STATUS_CASES = [
  { status: 200, label: '2xx' },
  { status: 404, label: '4xx' },
  { status: 500, label: '5xx' },
] as const;

describe('fetchWithStatus', () => {
  describe.each(STATUS_CASES)('$label response', ({ status }) => {
    it(`VALID: {status: ${status}, body present} => resolves {status, ok, body} rather than throwing`, async () => {
      const proxy = fetchWithStatusProxy();
      proxy.setupResponse({
        url: 'http://localhost/api/guilds',
        status,
        bodyText: '{"id":"g1"}',
      });

      const result = await fetchWithStatus({ url: 'http://localhost/api/guilds' });

      expect(result).toStrictEqual({
        status,
        ok: status >= 200 && status < 300,
        body: '{"id":"g1"}',
      });
    });
  });

  it('EMPTY: {response with no body} => resolves body as an empty string', async () => {
    const proxy = fetchWithStatusProxy();
    proxy.setupResponse({ url: 'http://localhost/api/guilds', status: 204, bodyText: '' });

    const result = await fetchWithStatus({ url: 'http://localhost/api/guilds' });

    expect(result).toStrictEqual({ status: 204, ok: true, body: '' });
  });

  it('ERROR: {connection refused, cause nested under fetch failed} => throws naming the url and the root cause code', async () => {
    const proxy = fetchWithStatusProxy();
    const rootCause = Object.assign(new Error('connect ECONNREFUSED 127.0.0.1:4000'), {
      code: 'ECONNREFUSED',
    });
    proxy.setupRefused({ url: 'http://localhost/api/guilds', cause: rootCause });

    const caught: unknown = await fetchWithStatus({ url: 'http://localhost/api/guilds' }).catch(
      (rejection: unknown) => rejection,
    );
    const error = caught as Error & { url: string; code: string };

    expect(error.message).toBe(
      'GET http://localhost/api/guilds failed: connect ECONNREFUSED 127.0.0.1:4000',
    );
    expect(error.url).toBe('http://localhost/api/guilds');
    expect(error.code).toBe('ECONNREFUSED');
  });

  it('ERROR: {timeoutMs elapses before any response} => aborts and throws naming the url', async () => {
    const proxy = fetchWithStatusProxy();
    proxy.setupAbortsOnSignal({ url: 'http://localhost/api/guilds' });

    const caught: unknown = await fetchWithStatus({
      url: 'http://localhost/api/guilds',
      timeoutMs: 5,
    }).catch((rejection: unknown) => rejection);
    const error = caught as Error & { url: string };

    expect(error.message).toBe(
      'GET http://localhost/api/guilds failed: This operation was aborted',
    );
    expect(error.url).toBe('http://localhost/api/guilds');
  });

  it('ERROR: {fetch rejects with an AbortError outright} => throws naming the url, with no code', async () => {
    const proxy = fetchWithStatusProxy();
    proxy.setupAbortImmediate({ url: 'http://localhost/api/guilds' });

    const caught: unknown = await fetchWithStatus({ url: 'http://localhost/api/guilds' }).catch(
      (rejection: unknown) => rejection,
    );
    const error = caught as Error & { url: string; code?: string };

    expect(error.message).toBe(
      'GET http://localhost/api/guilds failed: This operation was aborted',
    );
    expect(error.url).toBe('http://localhost/api/guilds');
    expect(error.code).toBe(undefined);
  });
});
