jest.mock('@hono/node-ws');

import { createNodeWebSocket } from '@hono/node-ws';

import type { WsClient } from '../../../contracts/ws-client/ws-client-contract';

export const honoCreateNodeWebSocketAdapterProxy = (): {
  simulateConnection: (params: { client: WsClient }) => void;
  simulateMessage: (params: { data: string; ws: WsClient }) => void;
  simulateDisconnect: (params: { ws: WsClient }) => void;
} => {
  const mock = jest.mocked(createNodeWebSocket);

  const captured: {
    factory?: () => {
      onOpen?: (evt: unknown, ws: unknown) => void;
      onMessage?: (evt: unknown, ws: unknown) => void;
      onClose?: (evt: unknown, ws: unknown) => void;
    };
  } = {};

  mock.mockReturnValue({
    injectWebSocket: jest.fn(),
    upgradeWebSocket: (
      factory: () => {
        onOpen?: (evt: unknown, ws: unknown) => void;
        onMessage?: (evt: unknown, ws: unknown) => void;
        onClose?: (evt: unknown, ws: unknown) => void;
      },
    ) => {
      captured.factory = factory;
      return jest.fn() as never;
    },
  } as never);

  return {
    simulateConnection: ({ client }: { client: WsClient }): void => {
      const handlers = captured.factory?.();
      handlers?.onOpen?.(undefined, client);
    },
    simulateMessage: ({ data, ws }: { data: string; ws: WsClient }): void => {
      const handlers = captured.factory?.();
      handlers?.onMessage?.({ data }, ws);
    },
    simulateDisconnect: ({ ws }: { ws: WsClient }): void => {
      const handlers = captured.factory?.();
      handlers?.onClose?.(undefined, ws);
    },
  };
};
