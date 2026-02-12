import { Hono } from 'hono';

import { honoCreateNodeWebSocketAdapter } from './hono-create-node-web-socket-adapter';
import { honoCreateNodeWebSocketAdapterProxy } from './hono-create-node-web-socket-adapter.proxy';

describe('honoCreateNodeWebSocketAdapter', () => {
  describe('successful creation', () => {
    it('VALID: {app} => returns websocket utilities', () => {
      honoCreateNodeWebSocketAdapterProxy();
      const app = new Hono();

      const result = honoCreateNodeWebSocketAdapter({ app });

      expect(typeof result.injectWebSocket).toBe('function');
      expect(typeof result.upgradeWebSocket).toBe('function');
    });
  });
});
