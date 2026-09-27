/**
 * PURPOSE: Wraps MSW's `ws` namespace (WebSocket link/handler creation) for use in responders
 *
 * USAGE:
 * const { ws } = mswWsAdapter();
 * server.use(ws.link('*').addEventListener('connection', ({ client }) => client.close()));
 */

import { ws } from 'msw';

export const mswWsAdapter = (): {
  ws: typeof ws;
} => ({
  ws,
});
