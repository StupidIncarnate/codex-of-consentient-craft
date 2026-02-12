jest.mock('@hono/node-server');

import { serve } from '@hono/node-server';

export const honoServeAdapterProxy = (): {
  getCapturedFetch: () => (request: Request) => Response | Promise<Response>;
} => {
  const mock = jest.mocked(serve);
  const captured: { fetch?: (request: Request) => Response | Promise<Response> } = {};

  mock.mockImplementation(((options: {
    fetch: (request: Request) => Response | Promise<Response>;
  }) => {
    captured.fetch = options.fetch;
    return {} as never;
  }) as unknown as typeof serve);

  return {
    getCapturedFetch: (): ((request: Request) => Response | Promise<Response>) => {
      if (!captured.fetch) {
        throw new Error('fetch not captured. Call StartServer() first.');
      }
      return captured.fetch;
    },
  };
};
