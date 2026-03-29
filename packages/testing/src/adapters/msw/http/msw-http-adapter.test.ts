import { mswHttpAdapter } from './msw-http-adapter';
import { mswHttpAdapterProxy } from './msw-http-adapter.proxy';

describe('mswHttpAdapter', () => {
  describe('exports', () => {
    it('VALID: {} => returns http and HttpResponse from msw', () => {
      mswHttpAdapterProxy();

      const result = mswHttpAdapter();

      expect(result).toStrictEqual({
        http: expect.any(Object),
        HttpResponse: expect.any(Function),
      });
    });
  });
});
