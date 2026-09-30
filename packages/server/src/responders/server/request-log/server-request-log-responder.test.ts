import { ResponseStub } from '#gateway/node/Response/response.stub';
import { ServerRequestLogResponderProxy } from './server-request-log-responder.proxy';

describe('ServerRequestLogResponder', () => {
  describe('request log enabled', () => {
    it('VALID: {GET 200} => writes the info line with method, path, status and duration', async () => {
      const proxy = ServerRequestLogResponderProxy();
      proxy.enableRequestLog();

      await proxy.callResponder({
        method: 'GET',
        path: '/api/guilds',
        response: ResponseStub({ body: '[]', status: 200 }),
        durationMs: 12,
        error: undefined,
      });

      proxy.disableRequestLog();

      expect(proxy.getWrittenLines()).toStrictEqual([['[http] info GET /api/guilds 200 12ms\n']]);
    });

    it('VALID: {GET 404} => writes the warn line with no body', async () => {
      const proxy = ServerRequestLogResponderProxy();
      proxy.enableRequestLog();

      await proxy.callResponder({
        method: 'GET',
        path: '/api/nope',
        response: ResponseStub({ body: '404 Not Found', status: 404 }),
        durationMs: 1,
        error: undefined,
      });

      proxy.disableRequestLog();

      expect(proxy.getWrittenLines()).toStrictEqual([['[http] warn GET /api/nope 404 1ms\n']]);
    });

    it('ERROR: {responder answered 500 with a JSON error body} => writes the error line carrying the body', async () => {
      const proxy = ServerRequestLogResponderProxy();
      proxy.enableRequestLog();
      const response = ResponseStub({ body: '{"error":"Failed to list guilds"}', status: 500 });

      await proxy.callResponder({
        method: 'GET',
        path: '/api/guilds',
        response,
        durationMs: 4,
        error: undefined,
      });

      proxy.disableRequestLog();

      expect(proxy.getWrittenLines()).toStrictEqual([
        ['[http] error GET /api/guilds 500 4ms: {"error":"Failed to list guilds"}\n'],
      ]);
      await expect(response.text()).resolves.toBe('{"error":"Failed to list guilds"}');
    });

    it('ERROR: {handler threw} => writes the error line carrying the thrown message', async () => {
      const proxy = ServerRequestLogResponderProxy();
      proxy.enableRequestLog();

      await proxy.callResponder({
        method: 'POST',
        path: '/api/quests/q1/start',
        response: ResponseStub({ body: 'Internal Server Error', status: 500 }),
        durationMs: 7,
        error: new Error('quest not found', { cause: new Error('ENOENT') }),
      });

      proxy.disableRequestLog();

      expect(proxy.getWrittenLines()).toStrictEqual([
        ['[http] error POST /api/quests/q1/start 500 7ms: quest not found | cause: ENOENT\n'],
      ]);
    });
  });

  describe('request log disabled', () => {
    it('VALID: {GET 200, switch unset} => writes nothing', async () => {
      const proxy = ServerRequestLogResponderProxy();
      proxy.disableRequestLog();

      await proxy.callResponder({
        method: 'GET',
        path: '/api/guilds',
        response: ResponseStub({ body: '[]', status: 200 }),
        durationMs: 12,
        error: undefined,
      });

      expect(proxy.getWrittenLines()).toStrictEqual([]);
    });

    it('ERROR: {handler threw, switch unset} => writes nothing', async () => {
      const proxy = ServerRequestLogResponderProxy();
      proxy.disableRequestLog();

      await proxy.callResponder({
        method: 'GET',
        path: '/api/guilds',
        response: ResponseStub({ body: 'Internal Server Error', status: 500 }),
        durationMs: 2,
        error: new Error('boom'),
      });

      expect(proxy.getWrittenLines()).toStrictEqual([]);
    });
  });
});
