import { createNodeWebSocket as pkgCreateNodeWebSocket } from '@hono/node-ws';
import { Hono } from 'hono';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { createNodeWebSocket } from './node-web-socket';
import type { WsHandlers } from './node-web-socket';

type CapturedApp = Parameters<typeof createNodeWebSocket>[0]['app'];

export const createNodeWebSocketProxy = (): {
  getCapturedApp: () => CapturedApp | undefined;
  getCapturedUpgradeFactory: () => (() => WsHandlers) | undefined;
} => {
  const handle = registerMock({ fn: createNodeWebSocket });
  const captured: { app?: CapturedApp; upgradeFactory?: () => WsHandlers } = {};
  // A throwaway real NodeWebSocket, built against a throwaway Hono app, so upgradeWebSocket's real
  // Hono-accepted middleware and injectWebSocket's real delegate both exist without a cast. Every
  // real caller's own app is captured separately below, from the init this mock actually receives.
  const real = pkgCreateNodeWebSocket({ app: new Hono() });

  // ServerInitResponder calls this once per test with a fresh { app } this proxy never sees ahead of
  // time (a fresh Hono instance per test, closures never compare equal) — [] is the honest address,
  // matching this same responder's own outboxWatchHandle precedent for a fresh-closure call.
  handle.calledWith([]).implement((init: Parameters<typeof createNodeWebSocket>[0]) => {
    captured.app = init.app;
    return {
      upgradeWebSocket: (factory: () => WsHandlers) => {
        captured.upgradeFactory = factory;
        return real.upgradeWebSocket(factory);
      },
      injectWebSocket: (): void => undefined,
    };
  });

  return {
    getCapturedApp: () => captured.app,
    getCapturedUpgradeFactory: () => captured.upgradeFactory,
  };
};
