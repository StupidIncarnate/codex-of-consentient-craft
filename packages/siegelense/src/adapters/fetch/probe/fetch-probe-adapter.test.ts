import { fetchProbeAdapter } from './fetch-probe-adapter';
import { fetchProbeAdapterProxy } from './fetch-probe-adapter.proxy';

describe('fetchProbeAdapter', () => {
  describe('a reachable server', () => {
    it('VALID: {url answers} => returns true', async () => {
      const proxy = fetchProbeAdapterProxy();
      const url = 'http://dungeonmaster.localhost:34172/api/guilds';
      proxy.setupReachable({ url });

      const result = await fetchProbeAdapter({ url, timeoutMs: 5_000 });

      expect(result).toBe(true);
    });
  });

  describe('a server that answers but is unhealthy', () => {
    it('EDGE: {url answers with a 500} => returns false, not ready', async () => {
      const proxy = fetchProbeAdapterProxy();
      const url = 'http://dungeonmaster.localhost:34172/api/guilds';
      proxy.setupServerError({ url });

      const result = await fetchProbeAdapter({ url, timeoutMs: 5_000 });

      expect(result).toBe(false);
    });
  });

  describe('a server that redirects', () => {
    it('EDGE: {url answers with a 302} => returns false, not ready', async () => {
      const proxy = fetchProbeAdapterProxy();
      const url = 'http://dungeonmaster.localhost:34172/api/guilds';
      proxy.setupRedirect({ url });

      const result = await fetchProbeAdapter({ url, timeoutMs: 5_000 });

      expect(result).toBe(false);
    });
  });

  describe('a server that answers with a client error', () => {
    it('EDGE: {url answers with a 404} => returns false, not ready', async () => {
      const proxy = fetchProbeAdapterProxy();
      const url = 'http://dungeonmaster.localhost:34172/api/guilds';
      proxy.setupClientError({ url });

      const result = await fetchProbeAdapter({ url, timeoutMs: 5_000 });

      expect(result).toBe(false);
    });
  });

  describe('an unreachable server', () => {
    it('ERROR: {connection refused} => returns false rather than throwing', async () => {
      const proxy = fetchProbeAdapterProxy();
      const url = 'http://dungeonmaster.localhost:34172/api/guilds';
      proxy.setupUnreachable({ url });

      const result = await fetchProbeAdapter({ url, timeoutMs: 5_000 });

      expect(result).toBe(false);
    });
  });

  describe('a probe that outlives its timeout', () => {
    it('ERROR: {timer abort} => returns false rather than throwing', async () => {
      const proxy = fetchProbeAdapterProxy();
      const url = 'http://dungeonmaster.localhost:34172/api/guilds';
      proxy.setupAborted({ url });

      const result = await fetchProbeAdapter({ url, timeoutMs: 5_000 });

      expect(result).toBe(false);
    });
  });

  describe('an unexpected error', () => {
    it('ERROR: {malformed URL} => propagates rather than reading as not-ready', async () => {
      const proxy = fetchProbeAdapterProxy();
      const url = 'http://dungeonmaster.localhost:34172/api/guilds';
      const malformedUrlError = new TypeError('Failed to parse URL from not-a-valid-url');
      proxy.setupUnexpectedError({ url, error: malformedUrlError });

      const caughtError = await fetchProbeAdapter({ url, timeoutMs: 5_000 }).catch(
        (error: unknown) => error,
      );

      expect(caughtError).toBe(malformedUrlError);
    });
  });
});
