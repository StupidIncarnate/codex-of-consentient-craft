/**
 * PURPOSE: A real `NodeWebSocket` handle, built by actually calling `@hono/node-ws`'s own
 * `createNodeWebSocket()` against a real Hono app — never a hand-typed object standing in for the
 * real upgrade/inject pair it returns.
 *
 * USAGE:
 * const { upgradeWebSocket, injectWebSocket } = NodeWebSocketStub();
 */
import { createNodeWebSocket } from '@hono/node-ws';
import type { NodeWebSocket } from '@hono/node-ws';
import { Hono } from 'hono';

export const NodeWebSocketStub = (): NodeWebSocket => createNodeWebSocket({ app: new Hono() });
