import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { NodeWebSocketStub } from './node-web-socket.stub';

describe('NodeWebSocketStub', () => {
  it('VALID: {} => a real injectWebSocket that wires a real "upgrade" listener onto a real server', async () => {
    const handle = NodeWebSocketStub();
    const server = serve({ fetch: new Hono().fetch, port: 0 });

    handle.injectWebSocket(server);

    await new Promise<void>((resolve) => {
      server.close(() => {
        resolve();
      });
    });

    expect(server.listenerCount('upgrade')).toBe(1);
  });

  it('VALID: {} => a real upgradeWebSocket middleware that Hono accepts as a route handler', () => {
    const handle = NodeWebSocketStub();
    const app = new Hono();

    const returned = app.get(
      '/ws',
      handle.upgradeWebSocket(() => ({})),
    );

    expect(returned).toBe(app);
  });
});
