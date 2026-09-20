import { fetchPostAdapter } from './fetch-post-adapter';
import { fetchPostAdapterProxy } from './fetch-post-adapter.proxy';
import { routeFailureTransformer } from '../../../transformers/route-failure/route-failure-transformer';
import { HttpResponseStub } from '../../../contracts/http-response/http-response.stub';

describe('fetchPostAdapter', () => {
  describe('a successful response', () => {
    it('VALID: {a 201 with a JSON body} => returns {url, status: 201, body: the raw text}', async () => {
      const proxy = fetchPostAdapterProxy();
      const { url } = HttpResponseStub({ url: 'http://localhost:3737/api/guilds' });
      proxy.succeeds({ url, status: 201, body: '{"id":"g1"}' });

      const result = await fetchPostAdapter({ url, fields: { name: 'Test Guild' } });

      expect(result).toStrictEqual({ url, status: 201, body: '{"id":"g1"}' });
    });
  });

  describe('a server error response', () => {
    it('VALID: {a 500 with an error body} => returns status 500 and the body, and does not throw', async () => {
      const proxy = fetchPostAdapterProxy();
      const { url } = HttpResponseStub({ url: 'http://localhost:3737/api/guilds' });
      proxy.succeeds({ url, status: 500, body: '{"error":"database unavailable"}' });

      const result = await fetchPostAdapter({ url, fields: {} });

      expect(result).toStrictEqual({ url, status: 500, body: '{"error":"database unavailable"}' });
    });
  });

  describe('a transport failure', () => {
    it('ERROR: {fetch rejects with connect ECONNREFUSED} => rejects naming the url and the reason', async () => {
      const proxy = fetchPostAdapterProxy();
      const { url } = HttpResponseStub({ url: 'http://localhost:3737/api/guilds' });
      proxy.throws({ url, error: new Error('connect ECONNREFUSED 127.0.0.1:1') });

      await expect(fetchPostAdapter({ url, fields: {} })).rejects.toThrow(
        /^POST http:\/\/localhost:3737\/api\/guilds refused: connect ECONNREFUSED 127\.0\.0\.1:1$/u,
      );
    });

    it('ERROR: {fetch rejects with connect ECONNREFUSED} => the real rejection still mines to the url', async () => {
      const proxy = fetchPostAdapterProxy();
      const { url } = HttpResponseStub({ url: 'http://localhost:3737/api/guilds' });
      proxy.throws({ url, error: new Error('connect ECONNREFUSED 127.0.0.1:1') });

      const cause = await fetchPostAdapter({ url, fields: {} }).catch((error: unknown) => error);

      expect(routeFailureTransformer({ cause })).toStrictEqual({
        url,
        status: null,
        responseBody: null,
      });
    });

    // `globalThis.fetch` itself never rejects with a bare `Error('connect ECONNREFUSED …')` — it
    // wraps the real reason one level down, in a `TypeError: fetch failed` whose `.cause` carries it.
    // `fetch-post-adapter.integration.test.ts` measures that real shape directly; this case pins the
    // unwrapping against it without a socket.
    it('ERROR: {fetch rejects with a wrapped "fetch failed" TypeError} => unwraps to the real cause’s message', async () => {
      const proxy = fetchPostAdapterProxy();
      const { url } = HttpResponseStub({ url: 'http://localhost:3737/api/guilds' });
      proxy.throws({
        url,
        error: new TypeError('fetch failed', {
          cause: new Error('connect ECONNREFUSED 127.0.0.1:41973'),
        }),
      });

      await expect(fetchPostAdapter({ url, fields: {} })).rejects.toThrow(
        /^POST http:\/\/localhost:3737\/api\/guilds refused: connect ECONNREFUSED 127\.0\.0\.1:41973$/u,
      );
    });
  });
});
