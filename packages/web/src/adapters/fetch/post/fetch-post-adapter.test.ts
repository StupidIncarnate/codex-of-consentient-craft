import { fetchPostAdapter } from './fetch-post-adapter';
import { fetchPostAdapterProxy } from './fetch-post-adapter.proxy';

describe('fetchPostAdapter', () => {
  describe('successful POST', () => {
    it('VALID: {url: "/api/quests/start", body: "request-payload"} => returns parsed JSON response', async () => {
      const proxy = fetchPostAdapterProxy();

      proxy.resolves({ data: 'start-response' });

      const result = await fetchPostAdapter({ url: '/api/quests/start', body: 'request-payload' });

      expect(result).toBe('start-response');
    });
  });

  describe('network error', () => {
    it('ERROR: {url: "/api/quests/start"} => throws when fetch rejects', async () => {
      const proxy = fetchPostAdapterProxy();

      proxy.rejects({ error: new Error('Network error') });

      await expect(fetchPostAdapter({ url: '/api/quests/start', body: 'payload' })).rejects.toThrow(
        /^Network error$/u,
      );
    });
  });

  describe('non-ok response', () => {
    it('ERROR: {url: "/api/quests/start", status: 500} => throws when response status is not ok', async () => {
      const proxy = fetchPostAdapterProxy();

      proxy.resolvesWithStatus({ status: 500, body: 'Internal Server Error' });

      await expect(fetchPostAdapter({ url: '/api/quests/start', body: 'payload' })).rejects.toThrow(
        /^POST \/api\/quests\/start failed with status 500$/u,
      );
    });
  });
});
