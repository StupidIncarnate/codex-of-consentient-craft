import { fetchOk } from './fetch-ok';
import { fetchOkProxy } from './fetch-ok.proxy';

describe('fetchOk', () => {
  it('VALID: {2xx response} => resolves true', async () => {
    const proxy = fetchOkProxy();
    proxy.setupReachable({ url: 'http://localhost/api/guilds' });

    const result = await fetchOk({ url: 'http://localhost/api/guilds', timeoutMs: 1000 });

    expect(result).toBe(true);
  });

  it('VALID: {5xx response} => resolves false rather than throwing', async () => {
    const proxy = fetchOkProxy();
    proxy.setupServerError({ url: 'http://localhost/api/guilds' });

    const result = await fetchOk({ url: 'http://localhost/api/guilds', timeoutMs: 1000 });

    expect(result).toBe(false);
  });

  it('VALID: {4xx response} => resolves false rather than throwing', async () => {
    const proxy = fetchOkProxy();
    proxy.setupClientError({ url: 'http://localhost/api/guilds' });

    const result = await fetchOk({ url: 'http://localhost/api/guilds', timeoutMs: 1000 });

    expect(result).toBe(false);
  });

  it('ERROR: {connection refused} => resolves false rather than throwing', async () => {
    const proxy = fetchOkProxy();
    proxy.setupUnreachable({ url: 'http://localhost/api/guilds' });

    const result = await fetchOk({ url: 'http://localhost/api/guilds', timeoutMs: 1000 });

    expect(result).toBe(false);
  });

  it('ERROR: {timeoutMs elapses before any response} => resolves false rather than throwing', async () => {
    const proxy = fetchOkProxy();
    proxy.setupAborted({ url: 'http://localhost/api/guilds' });

    const result = await fetchOk({ url: 'http://localhost/api/guilds', timeoutMs: 5 });

    expect(result).toBe(false);
  });

  it('ERROR: {an unrelated rejection, e.g. a coding defect} => propagates rather than reading as not-ready', async () => {
    const proxy = fetchOkProxy();
    const unexpected = new Error('TypeError: url is not a function');
    proxy.setupUnexpectedError({ url: 'http://localhost/api/guilds', error: unexpected });

    await expect(fetchOk({ url: 'http://localhost/api/guilds', timeoutMs: 1000 })).rejects.toBe(
      unexpected,
    );
  });

  describe('getCallsFor read-back', () => {
    it('VALID: {two probes of one url} => records the url and the abort-signal options of each call', async () => {
      const proxy = fetchOkProxy();
      proxy.setupReachable({ url: 'http://localhost/api/guilds' });

      await fetchOk({ url: 'http://localhost/api/guilds', timeoutMs: 1000 });
      await fetchOk({ url: 'http://localhost/api/guilds', timeoutMs: 2000 });

      const calls = proxy.getCallsFor({ url: 'http://localhost/api/guilds' });

      expect(JSON.stringify(calls)).toBe(
        '[["http://localhost/api/guilds",{"signal":{}}],["http://localhost/api/guilds",{"signal":{}}]]',
      );
    });
  });
});
