import { fetchWithStatus } from './fetch-with-status';
import { fetchWithStatusProxy } from './fetch-with-status.proxy';

const STATUS_CASES = [
  { status: 200, ok: true, label: '2xx' },
  { status: 404, ok: false, label: '4xx' },
  { status: 500, ok: false, label: '5xx' },
] as const;

describe('fetchWithStatus', () => {
  describe.each(STATUS_CASES)('$label response', ({ status, ok }) => {
    it(`VALID: {status: ${status}, body present} => resolves {status, ok, body} rather than throwing`, async () => {
      const proxy = fetchWithStatusProxy();
      proxy.setupResponse({ url: '/api/quests', status, bodyText: '{"id":"q1"}' });

      const result = await fetchWithStatus({ url: '/api/quests' });

      expect(result).toStrictEqual({
        status,
        ok,
        body: '{"id":"q1"}',
      });
    });
  });

  it('EMPTY: {response with no body} => resolves body as an empty string', async () => {
    const proxy = fetchWithStatusProxy();
    proxy.setupResponse({ url: '/api/quests', status: 204, bodyText: '' });

    const result = await fetchWithStatus({ url: '/api/quests' });

    expect(result).toStrictEqual({ status: 204, ok: true, body: '' });
  });

  it('ERROR: {connection refused} => throws naming the url, wrapping the real fetch failure', async () => {
    const proxy = fetchWithStatusProxy();
    proxy.setupRefused({ url: '/api/quests' });

    const caught: unknown = await fetchWithStatus({ url: '/api/quests' }).catch(
      (rejection: unknown) => rejection,
    );
    const error = caught as Error & { url: string };

    expect({ url: error.url, message: error.message }).toStrictEqual({
      url: '/api/quests',
      message: 'GET /api/quests failed: Failed to fetch',
    });
  });

  it('ERROR: {caller-supplied signal is already aborted} => rejects before any request is made', async () => {
    const controller = new AbortController();
    controller.abort();

    const caught: unknown = await fetchWithStatus({
      url: '/api/quests',
      signal: controller.signal,
    }).catch((rejection: unknown) => rejection);
    const error = caught as Error & { url: string };

    expect({ url: error.url, message: error.message }).toStrictEqual({
      url: '/api/quests',
      message: 'GET /api/quests failed: The operation was aborted.',
    });
  });

  it("ERROR: {caller's own signal fires while the response is held open} => rejects naming the url, once the abort is real", async () => {
    const proxy = fetchWithStatusProxy();
    proxy.setupHeld({ url: '/api/quests', bodyText: '{"id":"q1"}' });
    const controller = new AbortController();
    setTimeout(() => {
      controller.abort();
    }, 5);

    const caught: unknown = await fetchWithStatus({
      url: '/api/quests',
      signal: controller.signal,
    }).catch((rejection: unknown) => rejection);
    const error = caught as Error & { url: string };

    expect({ url: error.url, message: error.message }).toStrictEqual({
      url: '/api/quests',
      message: 'GET /api/quests failed: The operation was aborted.',
    });
  });

  describe('held response', () => {
    it('VALID: {held response released} => resolves the exact body text as staged', async () => {
      const proxy = fetchWithStatusProxy();
      const held = proxy.setupHeld({ url: '/api/quests', bodyText: '{"id":"q1","n":[1,2]}' });

      const pending = fetchWithStatus({ url: '/api/quests' });
      held.release();
      const result = await pending;

      expect(result).toStrictEqual({ status: 200, ok: true, body: '{"id":"q1","n":[1,2]}' });
    });

    it('VALID: {held bodyText that is not JSON, released} => resolves the text verbatim', async () => {
      const proxy = fetchWithStatusProxy();
      const held = proxy.setupHeld({ url: '/api/quests', bodyText: 'plain text, not json' });

      const pending = fetchWithStatus({ url: '/api/quests' });
      held.release();
      const result = await pending;

      expect(result).toStrictEqual({ status: 200, ok: true, body: 'plain text, not json' });
    });
  });

  describe('tolerant addressing', () => {
    it('VALID: {url registered without a query string} => still resolves for a call carrying one', async () => {
      const proxy = fetchWithStatusProxy();
      proxy.setupResponse({ url: '/api/quests', status: 200, bodyText: '{"id":"q1"}' });

      const result = await fetchWithStatus({ url: '/api/quests?computed-at-runtime=1' });

      expect(result).toStrictEqual({ status: 200, ok: true, body: '{"id":"q1"}' });
    });
  });

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getRequestBodies reads its body back', async () => {
      const proxy = fetchWithStatusProxy();
      proxy.setupResponse({ method: 'post', url: '/api/quests', status: 200, bodyText: '{}' });

      await fetchWithStatus({ url: '/api/quests', method: 'POST', body: { name: 'quest-1' } });

      await expect(
        proxy.getRequestBodies({ method: 'post', url: '/api/quests' }),
      ).resolves.toStrictEqual([{ name: 'quest-1' }]);
    });

    it('EMPTY: {no call made} => getRequestCount reads 0', () => {
      const proxy = fetchWithStatusProxy();
      proxy.setupResponse({ method: 'post', url: '/api/quests', status: 200, bodyText: '{}' });

      expect(proxy.getRequestCount({ method: 'post', url: '/api/quests' })).toBe(0);
    });

    it('VALID: {two calls to one address, one to another} => getRequestCount is per address', async () => {
      const proxy = fetchWithStatusProxy();
      proxy.setupResponse({ method: 'post', url: '/api/quests', status: 200, bodyText: '{}' });
      proxy.setupResponse({ method: 'post', url: '/api/guilds', status: 200, bodyText: '{}' });

      await fetchWithStatus({ url: '/api/quests', method: 'POST' });
      await fetchWithStatus({ url: '/api/quests', method: 'POST' });
      await fetchWithStatus({ url: '/api/guilds', method: 'POST' });

      expect({
        quests: proxy.getRequestCount({ method: 'post', url: '/api/quests' }),
        guilds: proxy.getRequestCount({ method: 'post', url: '/api/guilds' }),
      }).toStrictEqual({ quests: 2, guilds: 1 });
    });
  });
});
