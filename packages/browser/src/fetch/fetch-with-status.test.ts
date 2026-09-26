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
      proxy.setupResponse({ url: '/api/quests', status, bodyText: '{"id":"q1"}' });

      const result = await fetchWithStatus({ url: '/api/quests' });

      expect(result).toStrictEqual({
        status,
        ok: status >= 200 && status < 300,
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

  it('ERROR: {connection refused, cause nested under Failed to fetch} => throws naming the url and the root cause code', async () => {
    const proxy = fetchWithStatusProxy();
    const rootCause = Object.assign(new Error('net::ERR_CONNECTION_REFUSED'), {
      code: 'ECONNREFUSED',
    });
    proxy.setupRefused({ url: '/api/quests', cause: rootCause });

    const caught: unknown = await fetchWithStatus({ url: '/api/quests' }).catch(
      (rejection: unknown) => rejection,
    );
    const error = caught as Error & { url: string; code: string };

    expect(error.message).toBe('GET /api/quests failed: net::ERR_CONNECTION_REFUSED');
    expect(error.url).toBe('/api/quests');
    expect(error.code).toBe('ECONNREFUSED');
  });

  it('ERROR: {caller\'s own timeout fires the passed-in signal} => throws naming the url', async () => {
    const proxy = fetchWithStatusProxy();
    proxy.setupAbortsOnSignal({ url: '/api/quests' });
    const controller = new AbortController();
    setTimeout(() => {
      controller.abort();
    }, 5);

    const caught: unknown = await fetchWithStatus({
      url: '/api/quests',
      signal: controller.signal,
    }).catch((rejection: unknown) => rejection);
    const error = caught as Error & { url: string };

    expect(error.message).toBe('GET /api/quests failed: The user aborted a request.');
    expect(error.url).toBe('/api/quests');
  });

  it('ERROR: {fetch rejects with an AbortError outright} => throws naming the url, with no code', async () => {
    const proxy = fetchWithStatusProxy();
    proxy.setupAbortImmediate({ url: '/api/quests' });

    const caught: unknown = await fetchWithStatus({ url: '/api/quests' }).catch(
      (rejection: unknown) => rejection,
    );
    const error = caught as Error & { url: string; code?: string };

    expect(error.message).toBe('GET /api/quests failed: The user aborted a request.');
    expect(error.url).toBe('/api/quests');
    expect(error.code).toBe(undefined);
  });
});
