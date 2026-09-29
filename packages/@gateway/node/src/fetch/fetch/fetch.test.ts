import { fetch } from './fetch';
import { fetchProxy } from './fetch.proxy';

describe('fetch', () => {
  it('VALID: {url answered with 200 and a body} => resolves the raw Response with that status and text', async () => {
    const proxy = fetchProxy();
    proxy.setupResponse({
      url: 'http://localhost/api/guilds',
      status: 200,
      bodyText: '{"id":"g1"}',
    });

    const response = await fetch('http://localhost/api/guilds');

    expect({
      status: response.status,
      ok: response.ok,
      text: await response.text(),
    }).toStrictEqual({ status: 200, ok: true, text: '{"id":"g1"}' });
  });

  it('VALID: {url answered with 404 and a header} => resolves rather than throwing, headers intact', async () => {
    const proxy = fetchProxy();
    proxy.setupResponse({
      url: 'http://localhost/api/guilds',
      status: 404,
      bodyText: 'missing',
      headers: { 'x-request-id': 'r1' },
    });

    const response = await fetch('http://localhost/api/guilds');

    expect({
      status: response.status,
      ok: response.ok,
      header: response.headers.get('x-request-id'),
    }).toStrictEqual({ status: 404, ok: false, header: 'r1' });
  });

  it('EMPTY: {url answered with 204 and no body} => resolves with an empty text', async () => {
    const proxy = fetchProxy();
    proxy.setupResponse({ url: 'http://localhost/api/guilds', status: 204, bodyText: '' });

    const response = await fetch('http://localhost/api/guilds');

    expect({ status: response.status, text: await response.text() }).toStrictEqual({
      status: 204,
      text: '',
    });
  });

  it('VALID: {url, init with method and body} => the global receives both untouched', async () => {
    const proxy = fetchProxy();
    proxy.setupResponse({ url: 'http://localhost/api/guilds', status: 201, bodyText: '' });

    await fetch('http://localhost/api/guilds', { method: 'POST', body: '{"name":"g"}' });

    expect([...proxy.callsMatching({ url: 'http://localhost/api/guilds' })]).toStrictEqual([
      ['http://localhost/api/guilds', { method: 'POST', body: '{"name":"g"}' }],
    ]);
  });

  it('ERROR: {connection refused} => rejects with Node fetch failed carrying the cause', async () => {
    const proxy = fetchProxy();
    const cause = Object.assign(new Error('connect ECONNREFUSED 127.0.0.1:4000'), {
      code: 'ECONNREFUSED',
    });
    proxy.setupRefused({ url: 'http://localhost/api/guilds', cause });

    const caught: unknown = await fetch('http://localhost/api/guilds').catch(
      (rejection: unknown) => rejection,
    );

    expect(caught).toStrictEqual(new TypeError('fetch failed', { cause }));
  });
});
