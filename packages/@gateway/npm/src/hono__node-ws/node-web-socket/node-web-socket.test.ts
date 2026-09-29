import { Hono } from 'hono';
import { createNodeWebSocket } from './node-web-socket';
import { createNodeWebSocketProxy } from './node-web-socket.proxy';

describe('createNodeWebSocket', () => {
  it('VALID: {app} => the proxy captures the real app it was given', () => {
    const proxy = createNodeWebSocketProxy();
    const app = new Hono();
    proxy.setupUpgrade({ app });

    createNodeWebSocket({ app });

    expect(proxy.getCapturedApp()).toBe(app);
  });

  it('VALID: {a route registered through upgradeWebSocket} => Hono accepts the returned handler and the proxy captures the same factory', () => {
    const proxy = createNodeWebSocketProxy();
    const app = new Hono();
    proxy.setupUpgrade({ app });
    const { upgradeWebSocket } = createNodeWebSocket({ app });
    const factory = (): Record<PropertyKey, never> => ({});

    const returned = app.get('/ws', upgradeWebSocket(factory));

    expect(returned).toBe(app);
    expect(proxy.getCapturedUpgradeFactory()).toBe(factory);
  });

  it('EMPTY: {no call made yet} => getCapturedApp and getCapturedUpgradeFactory return undefined', () => {
    const proxy = createNodeWebSocketProxy();

    expect(proxy.getCapturedApp()).toBe(undefined);
    expect(proxy.getCapturedUpgradeFactory()).toBe(undefined);
  });
});
