import { routeFailureTransformer } from './route-failure-transformer';
import { HttpResponseStub } from '../../contracts/http-response/http-response.stub';

describe('routeFailureTransformer', () => {
  describe('a route that answered 2xx-5xx with a readable body', () => {
    it('VALID: {cause: an HttpResponse-shaped throw} => returns its url, status and body', () => {
      const cause = HttpResponseStub({
        url: 'http://localhost:3737/api/guilds',
        status: 500,
        body: '{"error":"database unavailable"}',
      });

      const result = routeFailureTransformer({ cause });

      expect(result).toStrictEqual({
        url: 'http://localhost:3737/api/guilds',
        status: 500,
        responseBody: '{"error":"database unavailable"}',
      });
    });
  });

  describe('a route that threw the native fetch Response shape', () => {
    it('VALID: {cause: a Response-shaped throw} => returns url and status, body null', () => {
      const result = routeFailureTransformer({
        cause: { url: 'http://localhost:3737/api/guilds', status: 500, body: null },
      });

      expect(result).toStrictEqual({
        url: 'http://localhost:3737/api/guilds',
        status: 500,
        responseBody: null,
      });
    });
  });

  describe('a refused connection whose thrower attached no url', () => {
    it('VALID: {cause: a bare ECONNREFUSED Error} => returns {url: null, status: null, responseBody: null}', () => {
      const result = routeFailureTransformer({
        cause: new Error('connect ECONNREFUSED 127.0.0.1:1'),
      });

      expect(result).toStrictEqual({ url: null, status: null, responseBody: null });
    });
  });

  describe('a refused connection whose thrower attached the url it tried', () => {
    it('VALID: {cause: an Error carrying url but no status} => returns the url, status null, body null', () => {
      const result = routeFailureTransformer({
        cause: Object.assign(new Error('connect ECONNREFUSED 127.0.0.1:1'), {
          url: 'http://localhost:3737/api/guilds',
        }),
      });

      expect(result).toStrictEqual({
        url: 'http://localhost:3737/api/guilds',
        status: null,
        responseBody: null,
      });
    });
  });

  describe('no cause at all', () => {
    it('EMPTY: {cause: undefined} => returns all three null', () => {
      const result = routeFailureTransformer({ cause: undefined });

      expect(result).toStrictEqual({ url: null, status: null, responseBody: null });
    });
  });
});
