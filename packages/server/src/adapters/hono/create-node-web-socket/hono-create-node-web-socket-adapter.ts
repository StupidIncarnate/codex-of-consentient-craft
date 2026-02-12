/**
 * PURPOSE: Wraps createNodeWebSocket from @hono/node-ws for mockability at I/O boundary
 *
 * USAGE:
 * const { injectWebSocket, upgradeWebSocket } = honoCreateNodeWebSocketAdapter({ app });
 * // Returns WebSocket utilities for the Hono app
 */

import { createNodeWebSocket } from '@hono/node-ws';
import type { Hono } from 'hono';

export const honoCreateNodeWebSocketAdapter = ({
  app,
}: {
  app: Hono;
}): ReturnType<typeof createNodeWebSocket> => createNodeWebSocket({ app });
