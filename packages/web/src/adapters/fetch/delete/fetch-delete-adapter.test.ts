import { fetchDeleteAdapter } from './fetch-delete-adapter';
import { fetchDeleteAdapterProxy } from './fetch-delete-adapter.proxy';

describe('fetchDeleteAdapter', () => {
  describe('successful DELETE', () => {
    it('VALID: {url: "/api/projects/proj-1"} => returns parsed JSON response', async () => {
      const proxy = fetchDeleteAdapterProxy();

      proxy.resolves({ data: 'delete-response' });

      const result = await fetchDeleteAdapter({ url: '/api/projects/proj-1' });

      expect(result).toBe('delete-response');
    });
  });

  describe('network error', () => {
    it('ERROR: {url: "/api/projects/proj-1"} => throws when fetch rejects', async () => {
      const proxy = fetchDeleteAdapterProxy();

      proxy.rejects({ error: new Error('Network error') });

      await expect(fetchDeleteAdapter({ url: '/api/projects/proj-1' })).rejects.toThrow(
        /^Network error$/u,
      );
    });
  });

  describe('non-ok response', () => {
    it('ERROR: {url: "/api/projects/proj-1", status: 404} => throws when response status is not ok', async () => {
      const proxy = fetchDeleteAdapterProxy();

      proxy.resolvesWithStatus({ status: 404, body: 'Not Found' });

      await expect(fetchDeleteAdapter({ url: '/api/projects/proj-1' })).rejects.toThrow(
        /^DELETE \/api\/projects\/proj-1 failed with status 404$/u,
      );
    });
  });
});
