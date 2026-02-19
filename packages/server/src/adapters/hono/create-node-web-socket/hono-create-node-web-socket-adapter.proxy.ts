jest.mock('@hono/node-ws');

import { createNodeWebSocket } from '@hono/node-ws';

import type { WsClient } from '../../../contracts/ws-client/ws-client-contract';

export const honoCreateNodeWebSocketAdapterProxy = (): {
  simulateConnection: (params: { client: WsClient }) => void;
} => {
  const mock = jest.mocked(createNodeWebSocket);

  const captured: { factory?: () => { onOpen?: (evt: unknown, ws: unknown) => void } } = {};

  mock.mockReturnValue({
    injectWebSocket: jest.fn(),
    upgradeWebSocket: (factory: () => { onOpen?: (evt: unknown, ws: unknown) => void }) => {
      captured.factory = factory;
      return jest.fn() as never;
    },
  } as never);

  return {
    simulateConnection: ({ client }: { client: WsClient }): void => {
      const handlers = captured.factory?.();
      handlers?.onOpen?.(undefined, client);
    },
  };
};
