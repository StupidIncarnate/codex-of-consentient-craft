import { fetchJson } from './fetch-json';
import { fetchJsonProxy } from './fetch-json.proxy';

describe('fetchJson', () => {
  it('VALID: {2xx JSON body} => resolves the parsed JSON', async () => {
    const proxy = fetchJsonProxy();
    proxy.setupSuccess({ url: '/api/guilds', body: { id: 'g1' } });

    const result = await fetchJson({ url: '/api/guilds' });

    expect(result).toStrictEqual({ id: 'g1' });
  });

  it('ERROR: {non-2xx response} => throws naming the url, status and body text', async () => {
    const proxy = fetchJsonProxy();
    proxy.setupNotOk({ url: '/api/guilds', status: 404, bodyText: 'not found' });

    await expect(fetchJson({ url: '/api/guilds' })).rejects.toThrow(
      /GET \/api\/guilds failed with status 404: not found/u,
    );
  });

  it('ERROR: {2xx with invalid JSON body} => throws naming the parse error and the raw body', async () => {
    const proxy = fetchJsonProxy();
    proxy.setupInvalidJson({ url: '/api/guilds', bodyText: 'not json at all' });

    await expect(fetchJson({ url: '/api/guilds' })).rejects.toThrow(
      /returned invalid JSON.*body: not json at all/u,
    );
  });

  it('EMPTY: {2xx with an empty body} => throws through the invalid-JSON branch rather than returning undefined', async () => {
    const proxy = fetchJsonProxy();
    proxy.setupEmptyBody({ url: '/api/guilds' });

    await expect(fetchJson({ url: '/api/guilds' })).rejects.toThrow(/returned invalid JSON/u);
  });

  it('ERROR: {browser refuses the connection} => propagates the real fetch failure unchanged', async () => {
    const proxy = fetchJsonProxy();
    proxy.setupConnectionRefused({ url: '/api/guilds' });

    const caught: unknown = await fetchJson({ url: '/api/guilds' }).catch(
      (rejection: unknown) => rejection,
    );
    const error = caught as Error;

    expect(error.message).toBe('Failed to fetch');
  });

  it('ERROR: {caller-supplied signal is already aborted} => rejects with AbortError before any request is made', async () => {
    const controller = new AbortController();
    controller.abort();

    const caught: unknown = await fetchJson({
      url: '/api/guilds',
      signal: controller.signal,
    }).catch((rejection: unknown) => rejection);
    const error = caught as Error;

    expect(error.name).toBe('AbortError');
  });

  describe('tolerant addressing', () => {
    it('VALID: {url registered without a query string} => still resolves for a call carrying one', async () => {
      const proxy = fetchJsonProxy();
      proxy.setupSuccess({ url: '/api/guilds', body: { id: 'g1' } });

      const result = await fetchJson({ url: '/api/guilds?computed-at-runtime=1' });

      expect(result).toStrictEqual({ id: 'g1' });
    });
  });

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getRequestBodies reads its body back', async () => {
      const proxy = fetchJsonProxy();
      proxy.setupSuccess({ method: 'post', url: '/api/guilds', body: { id: 'g1' } });

      await fetchJson({ url: '/api/guilds', method: 'POST', body: { name: 'guild-1' } });

      await expect(
        proxy.getRequestBodies({ method: 'post', url: '/api/guilds' }),
      ).resolves.toStrictEqual([{ name: 'guild-1' }]);
    });
  });
});
