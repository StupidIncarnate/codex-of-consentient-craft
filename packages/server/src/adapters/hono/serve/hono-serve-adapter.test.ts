import { honoServeAdapter } from './hono-serve-adapter';
import { honoServeAdapterProxy } from './hono-serve-adapter.proxy';

describe('honoServeAdapter', () => {
  describe('successful serve', () => {
    it('VALID: {fetch, port, hostname, onListen} => captures fetch function', () => {
      const proxy = honoServeAdapterProxy();
      const fetchFn = ((_req: Request): Response => new Response('ok')) as never;

      honoServeAdapter({
        fetch: fetchFn,
        port: 3737,
        hostname: 'localhost',
        onListen: jest.fn(),
      });

      const capturedFetch = proxy.getCapturedFetch();

      expect(typeof capturedFetch).toBe('function');
    });
  });
});
