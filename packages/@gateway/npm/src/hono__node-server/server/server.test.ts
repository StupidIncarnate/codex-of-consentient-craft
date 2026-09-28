import { serve } from './server';
import { serveProxy } from './server.proxy';

describe('serve', () => {
  it('VALID: {fetch, port, hostname} => the proxy captures every field back', () => {
    const proxy = serveProxy();
    const fetchHandler = (): Response => new Response('ok');

    serve({ fetch: fetchHandler, port: 3737, hostname: '127.0.0.1' });

    expect(proxy.getCapturedOptions()).toStrictEqual({
      fetch: fetchHandler,
      port: 3737,
      hostname: '127.0.0.1',
    });
  });

  it('EMPTY: {hostname omitted} => the captured options carry no hostname key', () => {
    const proxy = serveProxy();
    const fetchHandler = (): Response => new Response('ok');

    serve({ fetch: fetchHandler, port: 3737 });

    expect(proxy.getCapturedOptions()).toStrictEqual({
      fetch: fetchHandler,
      port: 3737,
    });
  });

  it('VALID: {} => the mocked call still returns a real, never-listening ServerType', () => {
    serveProxy();

    const server = serve({ fetch: (): Response => new Response('ok'), port: 0 });

    expect(server.listening).toBe(false);
  });

  it('EMPTY: {no call made yet} => getCapturedOptions returns undefined', () => {
    const proxy = serveProxy();

    expect(proxy.getCapturedOptions()).toBe(undefined);
  });
});
