/**
 * PURPOSE: OUR guarded `createNodeWebSocket`, the one place `@hono/node-ws` builds the WebSocket
 * upgrade pair from. `upgradeWebSocket`'s real type is doubly overloaded (a route-factory call and
 * a direct-events call); this narrows it to the single factory-style call
 * (`upgradeWebSocket(() => ({onOpen, onMessage, onClose}))`) every caller in this repo uses — a
 * caller needing the direct two-argument form extends this file rather than reaching for the raw
 * npm package.
 *
 * USAGE:
 * const { upgradeWebSocket, injectWebSocket } = createNodeWebSocket({ app });
 */
import { createNodeWebSocket as pkgCreateNodeWebSocket } from '@hono/node-ws';
import type { MiddlewareHandler } from 'hono';
import type { ServerType } from '@hono/node-server';

export interface WsHandlers {
  onOpen?: (evt: unknown, ws: unknown) => void;
  onMessage?: (evt: unknown, ws: unknown) => void;
  onClose?: (evt: unknown, ws: unknown) => void;
  onError?: (evt: unknown, ws: unknown) => void;
}

export const createNodeWebSocket = (
  init: Parameters<typeof pkgCreateNodeWebSocket>[0],
): {
  upgradeWebSocket: (factory: () => WsHandlers) => MiddlewareHandler;
  injectWebSocket: (server: ServerType) => void;
} => {
  const real = pkgCreateNodeWebSocket(init);
  return {
    upgradeWebSocket: (factory) => real.upgradeWebSocket(factory),
    injectWebSocket: (server) => {
      real.injectWebSocket(server);
    },
  };
};
