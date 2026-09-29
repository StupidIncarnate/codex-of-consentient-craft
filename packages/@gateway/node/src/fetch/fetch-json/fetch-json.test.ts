import { fetchJson } from './fetch-json';
import { fetchJsonProxy } from './fetch-json.proxy';

describe('fetchJson', () => {
  it('VALID: {2xx JSON body} => resolves the parsed JSON', async () => {
    const proxy = fetchJsonProxy();
    proxy.setupSuccess({ url: 'http://localhost/api/guilds', body: { id: 'g1' } });

    const result = await fetchJson({ url: 'http://localhost/api/guilds' });

    expect(result).toStrictEqual({ id: 'g1' });
  });

  it('ERROR: {non-2xx response} => throws naming the url, status and body text', async () => {
    const proxy = fetchJsonProxy();
    proxy.setupNotOk({ url: 'http://localhost/api/guilds', status: 404, bodyText: 'not found' });

    await expect(fetchJson({ url: 'http://localhost/api/guilds' })).rejects.toThrow(
      /GET http:\/\/localhost\/api\/guilds failed with status 404: not found/u,
    );
  });

  it('ERROR: {2xx with invalid JSON body} => throws naming the parse error and the raw body', async () => {
    const proxy = fetchJsonProxy();
    proxy.setupInvalidJson({ url: 'http://localhost/api/guilds', bodyText: 'not json at all' });

    await expect(fetchJson({ url: 'http://localhost/api/guilds' })).rejects.toThrow(
      /returned invalid JSON.*body: not json at all/u,
    );
  });

  it('EMPTY: {2xx with an empty body} => throws through the invalid-JSON branch rather than returning undefined', async () => {
    const proxy = fetchJsonProxy();
    proxy.setupEmptyBody({ url: 'http://localhost/api/guilds' });

    await expect(fetchJson({ url: 'http://localhost/api/guilds' })).rejects.toThrow(
      /returned invalid JSON/u,
    );
  });

  it('ERROR: {connection refused} => propagates the real fetch failure unchanged', async () => {
    const proxy = fetchJsonProxy();
    proxy.setupConnectionRefused({ url: 'http://localhost/api/guilds' });

    const caught: unknown = await fetchJson({ url: 'http://localhost/api/guilds' }).catch(
      (rejection: unknown) => rejection,
    );
    const error = caught as NodeJS.ErrnoException;

    expect({ code: error.code, syscall: error.syscall }).toStrictEqual({
      code: 'ECONNREFUSED',
      syscall: 'connect',
    });
  });

  it('ERROR: {timeoutMs elapses before any response} => aborts and rejects with AbortError', async () => {
    const proxy = fetchJsonProxy();
    proxy.setupAborted({ url: 'http://localhost/api/guilds' });

    const caught: unknown = await fetchJson({
      url: 'http://localhost/api/guilds',
      timeoutMs: 5,
    }).catch((rejection: unknown) => rejection);
    const error = caught as Error;

    expect(error.name).toBe('AbortError');
  });

  it('VALID: {POST with an object body} => fetch receives the url, method, json content-type and serialized body', async () => {
    const proxy = fetchJsonProxy();
    proxy.setupSuccess({ url: 'http://localhost/api/guilds', body: { id: 'g1' } });

    await fetchJson({
      url: 'http://localhost/api/guilds',
      method: 'POST',
      body: { name: 'guild-1' },
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
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{"name":"guild-1"}',
      },
    ]);
  });

  it('EMPTY: {no call made} => getCallsFor answers an empty list', () => {
    const proxy = fetchJsonProxy();
    proxy.setupSuccess({ url: 'http://localhost/api/guilds', body: {} });

    expect(proxy.getCallsFor({ url: 'http://localhost/api/guilds' })).toStrictEqual([]);
  });
});
