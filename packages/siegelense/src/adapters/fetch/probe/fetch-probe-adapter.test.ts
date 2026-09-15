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

  describe('an unreachable server', () => {
    it('ERROR: {connection refused} => returns false rather than throwing', async () => {
      const proxy = fetchProbeAdapterProxy();
      const url = 'http://dungeonmaster.localhost:34172/api/guilds';
      proxy.setupUnreachable({ url });

      const result = await fetchProbeAdapter({ url, timeoutMs: 5_000 });

      expect(result).toBe(false);
    });
  });
});
