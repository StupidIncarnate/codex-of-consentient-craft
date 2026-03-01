import { mswHttpAdapter } from './msw-http-adapter';
import { mswHttpAdapterProxy } from './msw-http-adapter.proxy';

describe('mswHttpAdapter', () => {
  describe('exports', () => {
    it('VALID: {} => returns http and HttpResponse from msw', () => {
      mswHttpAdapterProxy();

      const { http, HttpResponse } = mswHttpAdapter();

      expect(typeof http.get).toBe('function');
      expect(typeof http.post).toBe('function');
      expect(typeof HttpResponse.json).toBe('function');
      expect(typeof HttpResponse.error).toBe('function');
    });
  });
});
