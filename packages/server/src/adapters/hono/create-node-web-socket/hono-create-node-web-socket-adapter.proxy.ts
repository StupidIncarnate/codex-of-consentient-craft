jest.mock('@hono/node-ws');

import { createNodeWebSocket } from '@hono/node-ws';

export const honoCreateNodeWebSocketAdapterProxy = (): Record<PropertyKey, never> => {
  const mock = jest.mocked(createNodeWebSocket);

  mock.mockReturnValue({
    injectWebSocket: jest.fn(),
    upgradeWebSocket: () => jest.fn() as never,
  } as never);

  return {};
};
