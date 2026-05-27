import { fetchPatchAdapter } from './fetch-patch-adapter';
import { fetchPatchAdapterProxy } from './fetch-patch-adapter.proxy';

describe('fetchPatchAdapter', () => {
  describe('successful PATCH', () => {
    it('VALID: {ok response} => resolves with success', async () => {
      const proxy = fetchPatchAdapterProxy();
      proxy.setupSuccess();

      const result = await fetchPatchAdapter({
        url: 'http://dungeonmaster.localhost:3737/api/quests/q-1',
        body: { designDecisions: [] },
      });

      expect(result).toStrictEqual({ success: true });
    });
  });

  describe('non-OK response', () => {
    it('INVALID: {status 500 response} => throws with url and status', async () => {
      const proxy = fetchPatchAdapterProxy();
      proxy.setupNotOk({ status: 500, bodyText: 'Internal Server Error' });

      await expect(
        fetchPatchAdapter({
          url: 'http://dungeonmaster.localhost:3737/api/quests/q-1',
          body: { designDecisions: [] },
        }),
      ).rejects.toThrow(/PATCH.*500/u);
    });
  });

  describe('network error', () => {
    it('ERROR: {fetch throws} => propagates the error', async () => {
      const proxy = fetchPatchAdapterProxy();
      proxy.setupNetworkError({ error: new Error('ECONNREFUSED') });

      await expect(
        fetchPatchAdapter({
          url: 'http://dungeonmaster.localhost:3737/api/quests/q-1',
          body: { designDecisions: [] },
        }),
      ).rejects.toThrow('ECONNREFUSED');
    });
  });
});
