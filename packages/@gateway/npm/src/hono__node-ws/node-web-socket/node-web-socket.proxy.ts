import { createNodeWebSocket as pkgCreateNodeWebSocket } from '@hono/node-ws';
import { Hono } from 'hono';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { createNodeWebSocket } from './node-web-socket';
import type { WsHandlers } from './node-web-socket';

type CapturedApp = Parameters<typeof createNodeWebSocket>[0]['app'];

export const createNodeWebSocketProxy = (): {
  setupUpgrade: (params: { app: CapturedApp }) => void;
  getCapturedApp: () => CapturedApp | undefined;
  getCapturedUpgradeFactory: () => (() => WsHandlers) | undefined;
} => {
  const handle = registerMock({ fn: createNodeWebSocket });
  const captured: { app?: CapturedApp; upgradeFactory?: () => WsHandlers } = {};
  // A throwaway real NodeWebSocket, built against a throwaway Hono app, so upgradeWebSocket's real
  // Hono-accepted middleware and injectWebSocket's real delegate both exist without a cast.
  const real = pkgCreateNodeWebSocket({ app: new Hono() });

  return {
    // Addressed by identity of the exact app the caller built and will hand the responder, so a
    // createNodeWebSocket call for any other app is unstaged.
    setupUpgrade: ({ app }: { app: CapturedApp }): void => {
      handle
        .calledWith([(init: Parameters<typeof createNodeWebSocket>[0]) => init.app === app])
        .implement((init: Parameters<typeof createNodeWebSocket>[0]) => {
          captured.app = init.app;
          return {
            upgradeWebSocket: (factory: () => WsHandlers) => {
              captured.upgradeFactory = factory;
              return real.upgradeWebSocket(factory);
            },
            injectWebSocket: (): void => undefined,
          };
        });
    },
    getCapturedApp: () => captured.app,
    getCapturedUpgradeFactory: () => captured.upgradeFactory,
  };
};
