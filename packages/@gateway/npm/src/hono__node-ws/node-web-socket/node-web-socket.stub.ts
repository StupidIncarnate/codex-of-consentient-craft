/**
 * PURPOSE: A real `{upgradeWebSocket, injectWebSocket}` handle, built by actually calling this
 * subpath's own `createNodeWebSocket()` against a real Hono app — never a hand-typed object
 * standing in for the real upgrade/inject pair it returns.
 *
 * USAGE:
 * const { upgradeWebSocket, injectWebSocket } = NodeWebSocketStub();
 */
import { Hono } from 'hono';
import { createNodeWebSocket } from './node-web-socket';

export const NodeWebSocketStub = (): ReturnType<typeof createNodeWebSocket> =>
  createNodeWebSocket({ app: new Hono() });
