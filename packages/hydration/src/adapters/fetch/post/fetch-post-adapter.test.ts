import { fetchPostAdapter } from './fetch-post-adapter';
import { fetchPostAdapterProxy } from './fetch-post-adapter.proxy';
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
    it('ERROR: {fetch rejects} => rejects with the original cause', async () => {
      const proxy = fetchPostAdapterProxy();
      const { url } = HttpResponseStub({ url: 'http://localhost:3737/api/guilds' });
      proxy.throws({ url, error: new Error('connect ECONNREFUSED 127.0.0.1:1') });

      await expect(fetchPostAdapter({ url, fields: {} })).rejects.toThrow(
        'connect ECONNREFUSED 127.0.0.1:1',
      );
    });
  });
});
