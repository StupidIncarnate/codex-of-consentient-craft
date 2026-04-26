import { fetchGetAdapter } from './fetch-get-adapter';
import { fetchGetAdapterProxy } from './fetch-get-adapter.proxy';

describe('fetchGetAdapter', () => {
  describe('successful requests', () => {
    it('VALID: {url, ok response with JSON} => returns parsed JSON', async () => {
      const proxy = fetchGetAdapterProxy();
      proxy.setupSuccess({ body: { status: 'running', queuePosition: 2 } });

      const result = await fetchGetAdapter({
        url: 'http://localhost:4750/api/process/proc-foo',
      });

      expect(result).toStrictEqual({ status: 'running', queuePosition: 2 });
    });
  });

  describe('non-OK responses', () => {
    it('ERROR: {404 response with body} => throws with URL, status, and body text', async () => {
      const proxy = fetchGetAdapterProxy();
      proxy.setupNotOk({ status: 404, bodyText: 'Process not found' });

      await expect(
        fetchGetAdapter({ url: 'http://localhost:4750/api/process/proc-foo' }),
      ).rejects.toThrow(
        'GET http://localhost:4750/api/process/proc-foo failed with status 404: Process not found',
      );
    });

    it('ERROR: {500 response with empty body} => throws with URL and status', async () => {
      const proxy = fetchGetAdapterProxy();
      proxy.setupNotOk({ status: 500, bodyText: '' });

      await expect(
        fetchGetAdapter({ url: 'http://localhost:4750/api/process/proc-foo' }),
      ).rejects.toThrow('GET http://localhost:4750/api/process/proc-foo failed with status 500: ');
    });
  });

  describe('invalid JSON responses', () => {
    it('ERROR: {ok response with non-JSON body} => throws with URL and body in message', async () => {
      const proxy = fetchGetAdapterProxy();
      proxy.setupInvalidJson({ bodyText: 'not json at all' });

      await expect(
        fetchGetAdapter({ url: 'http://localhost:4750/api/process/proc-foo' }),
      ).rejects.toThrow(
        /^GET http:\/\/localhost:4750\/api\/process\/proc-foo returned invalid JSON: .*\(body: not json at all\)$/u,
      );
    });
  });
});
