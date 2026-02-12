import { fetchPatchAdapter } from './fetch-patch-adapter';
import { fetchPatchAdapterProxy } from './fetch-patch-adapter.proxy';

describe('fetchPatchAdapter', () => {
  describe('successful PATCH', () => {
    it('VALID: {url: "/api/quests/q-1", body: "update-payload"} => returns parsed JSON response', async () => {
      const proxy = fetchPatchAdapterProxy();

      proxy.resolves({ data: 'patch-response' });

      const result = await fetchPatchAdapter({ url: '/api/quests/q-1', body: 'update-payload' });

      expect(result).toBe('patch-response');
    });
  });

  describe('network error', () => {
    it('ERROR: {url: "/api/quests/q-1"} => throws when fetch rejects', async () => {
      const proxy = fetchPatchAdapterProxy();

      proxy.rejects({ error: new Error('Network error') });

      await expect(fetchPatchAdapter({ url: '/api/quests/q-1', body: 'payload' })).rejects.toThrow(
        /^Network error$/u,
      );
    });
  });

  describe('non-ok response', () => {
    it('ERROR: {url: "/api/quests/q-1", status: 422} => throws when response status is not ok', async () => {
      const proxy = fetchPatchAdapterProxy();

      proxy.resolvesWithStatus({ status: 422, body: 'Unprocessable Entity' });

      await expect(fetchPatchAdapter({ url: '/api/quests/q-1', body: 'payload' })).rejects.toThrow(
        /^PATCH \/api\/quests\/q-1 failed with status 422$/u,
      );
    });
  });
});
