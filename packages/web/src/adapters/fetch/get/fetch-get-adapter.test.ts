import { fetchGetAdapter } from './fetch-get-adapter';
import { fetchGetAdapterProxy } from './fetch-get-adapter.proxy';

describe('fetchGetAdapter', () => {
  describe('successful GET', () => {
    it('VALID: {url: "/api/quests"} => returns parsed JSON response', async () => {
      const proxy = fetchGetAdapterProxy();

      proxy.resolves({ data: 'quest-list-response' });

      const result = await fetchGetAdapter({ url: '/api/quests' });

      expect(result).toBe('quest-list-response');
    });
  });

  describe('network error', () => {
    it('ERROR: {url: "/api/quests"} => throws when fetch rejects', async () => {
      const proxy = fetchGetAdapterProxy();

      proxy.rejects({ error: new Error('Network error') });

      await expect(fetchGetAdapter({ url: '/api/quests' })).rejects.toThrow(/^Network error$/u);
    });
  });

  describe('non-ok response', () => {
    it('ERROR: {url: "/api/quests", status: 404} => throws when response status is not ok', async () => {
      const proxy = fetchGetAdapterProxy();

      proxy.resolvesWithStatus({ status: 404, body: 'Not Found' });

      await expect(fetchGetAdapter({ url: '/api/quests' })).rejects.toThrow(
        /^GET \/api\/quests failed with status 404$/u,
      );
    });
  });
});
