import { fetchGetWithStatusAdapter } from './fetch-get-with-status-adapter';
import { fetchGetWithStatusAdapterProxy } from './fetch-get-with-status-adapter.proxy';

describe('fetchGetWithStatusAdapter', () => {
  describe('successful GET', () => {
    it('VALID: {200 OK with JSON body} => returns status 200, ok true, parsed body', async () => {
      const proxy = fetchGetWithStatusAdapterProxy();
      proxy.setupOk({ body: { questId: 'q-1' } });

      const result = await fetchGetWithStatusAdapter({
        url: 'http://dungeonmaster.localhost:3737/api/quests/by-session/s-1',
      });

      expect(result).toStrictEqual({
        status: 200,
        ok: true,
        body: { questId: 'q-1' },
      });
    });
  });

  describe('not found', () => {
    it('VALID: {404 with JSON error body} => returns status 404, ok false, parsed body', async () => {
      const proxy = fetchGetWithStatusAdapterProxy();
      proxy.setupStatus({ status: 404, body: { error: 'No quest found for session' } });

      const result = await fetchGetWithStatusAdapter({
        url: 'http://dungeonmaster.localhost:3737/api/quests/by-session/s-missing',
      });

      expect(result).toStrictEqual({
        status: 404,
        ok: false,
        body: { error: 'No quest found for session' },
      });
    });
  });

  describe('server error', () => {
    it('VALID: {500 with JSON body} => returns status 500, ok false, parsed body', async () => {
      const proxy = fetchGetWithStatusAdapterProxy();
      proxy.setupStatus({ status: 500, body: { error: 'Boom' } });

      const result = await fetchGetWithStatusAdapter({
        url: 'http://dungeonmaster.localhost:3737/api/quests/by-session/s-1',
      });

      expect(result).toStrictEqual({
        status: 500,
        ok: false,
        body: { error: 'Boom' },
      });
    });
  });

  describe('non-JSON body', () => {
    it('VALID: {200 with raw text body} => returns body as raw string', async () => {
      const proxy = fetchGetWithStatusAdapterProxy();
      proxy.setupRawText({ status: 200, text: 'not json' });

      const result = await fetchGetWithStatusAdapter({
        url: 'http://dungeonmaster.localhost:3737/api/quests/by-session/s-1',
      });

      expect(result).toStrictEqual({
        status: 200,
        ok: true,
        body: 'not json',
      });
    });
  });

  describe('empty body', () => {
    it('EMPTY: {204 with empty body} => returns body as null', async () => {
      const proxy = fetchGetWithStatusAdapterProxy();
      proxy.setupRawText({ status: 204, text: '' });

      const result = await fetchGetWithStatusAdapter({
        url: 'http://dungeonmaster.localhost:3737/api/quests/by-session/s-1',
      });

      expect(result).toStrictEqual({
        status: 204,
        ok: true,
        body: null,
      });
    });
  });

  describe('connection error', () => {
    it('ERROR: {fetch throws TypeError} => propagates the error to the caller', async () => {
      const proxy = fetchGetWithStatusAdapterProxy();
      proxy.setupNetworkError({ error: new TypeError('fetch failed') });

      await expect(
        fetchGetWithStatusAdapter({
          url: 'http://dungeonmaster.localhost:3737/api/quests/by-session/s-1',
        }),
      ).rejects.toThrow('fetch failed');
    });
  });
});
