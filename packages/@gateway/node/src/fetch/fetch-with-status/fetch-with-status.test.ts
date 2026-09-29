import { fetchWithStatus } from './fetch-with-status';
import { fetchWithStatusProxy } from './fetch-with-status.proxy';

const STATUS_CASES = [
  { status: 200, ok: true, label: '2xx' },
  { status: 404, ok: false, label: '4xx' },
  { status: 500, ok: false, label: '5xx' },
] as const;

describe('fetchWithStatus', () => {
  describe.each(STATUS_CASES)('$label response', ({ status, ok }) => {
    it(`VALID: {status: ${status}, body present} => resolves {status, statusText, ok, body} rather than throwing`, async () => {
      const proxy = fetchWithStatusProxy();
      proxy.setupResponse({
        url: 'http://localhost/api/guilds',
        status,
        bodyText: '{"id":"g1"}',
      });

      const result = await fetchWithStatus({ url: 'http://localhost/api/guilds' });

      expect(result).toStrictEqual({
        status,
        statusText: '',
        ok,
        body: '{"id":"g1"}',
      });
    });
  });

  it('EMPTY: {response with no body} => resolves body as an empty string', async () => {
    const proxy = fetchWithStatusProxy();
    proxy.setupResponse({ url: 'http://localhost/api/guilds', status: 204, bodyText: '' });

    const result = await fetchWithStatus({ url: 'http://localhost/api/guilds' });

    expect(result).toStrictEqual({ status: 204, statusText: '', ok: true, body: '' });
  });

  it('VALID: {response staged with statusText Created} => resolves that statusText beside status and body', async () => {
    const proxy = fetchWithStatusProxy();
    proxy.setupResponse({
      url: 'http://localhost/api/guilds',
      status: 201,
      statusText: 'Created',
      bodyText: '{"id":"g2"}',
    });

    const result = await fetchWithStatus({ url: 'http://localhost/api/guilds' });

    expect(result).toStrictEqual({
      status: 201,
      statusText: 'Created',
      ok: true,
      body: '{"id":"g2"}',
    });
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

    expect({ message: error.message, url: error.url, code: error.code }).toStrictEqual({
      message: 'GET http://localhost/api/guilds failed: connect ECONNREFUSED 127.0.0.1:4000',
      url: 'http://localhost/api/guilds',
      code: 'ECONNREFUSED',
    });
  });

  it('ERROR: {timeoutMs elapses before any response} => aborts and throws naming the url', async () => {
    const proxy = fetchWithStatusProxy();
    proxy.setupAbortsOnSignal({ url: 'http://localhost/api/guilds' });

    const caught: unknown = await fetchWithStatus({
      url: 'http://localhost/api/guilds',
      timeoutMs: 5,
    }).catch((rejection: unknown) => rejection);
    const error = caught as Error & { url: string };

    expect({ message: error.message, url: error.url }).toStrictEqual({
      message: 'GET http://localhost/api/guilds failed: This operation was aborted',
      url: 'http://localhost/api/guilds',
    });
  });

  it('ERROR: {fetch rejects with an AbortError outright} => throws naming the url, with no code', async () => {
    const proxy = fetchWithStatusProxy();
    proxy.setupAbortImmediate({ url: 'http://localhost/api/guilds' });

    const caught: unknown = await fetchWithStatus({ url: 'http://localhost/api/guilds' }).catch(
      (rejection: unknown) => rejection,
    );
    const error = caught as Error & { url: string; code?: string };

    expect({ message: error.message, url: error.url, code: error.code }).toStrictEqual({
      message: 'GET http://localhost/api/guilds failed: This operation was aborted',
      url: 'http://localhost/api/guilds',
      code: undefined,
    });
  });

  it('VALID: {two calls to one url} => getCallsFor returns each call in order with method, headers and body', async () => {
    const proxy = fetchWithStatusProxy();
    proxy.setupResponse({ url: 'http://localhost/api/guilds', status: 200, bodyText: '{}' });

    await fetchWithStatus({ url: 'http://localhost/api/guilds' });
    await fetchWithStatus({
      url: 'http://localhost/api/guilds',
      method: 'PUT',
      headers: { 'x-trace': 'abc' },
      body: { name: 'guild-2' },
    });

    expect(
      proxy.getCallsFor({ url: 'http://localhost/api/guilds' }).map(([calledUrl, init]) => ({
        calledUrl,
        method: (init as RequestInit).method,
        headers: (init as RequestInit).headers,
        body: (init as RequestInit).body,
      })),
    ).toStrictEqual([
      {
        calledUrl: 'http://localhost/api/guilds',
        method: 'GET',
        headers: undefined,
        body: undefined,
      },
      {
        calledUrl: 'http://localhost/api/guilds',
        method: 'PUT',
        headers: { 'x-trace': 'abc' },
        body: '{"name":"guild-2"}',
      },
    ]);
  });
});
