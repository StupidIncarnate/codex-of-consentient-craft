import { serve } from '@hono/node-server';
import { registerMock, registerModuleMock } from '@dungeonmaster/testing/register-mock';

// Module-level mock prevents @hono/node-server from loading and registering SIGTERM listeners
registerModuleMock({ module: '@hono/node-server' });

export const honoServeAdapterProxy = (): {
  getCapturedFetch: () => (request: Request) => Response | Promise<Response>;
} => {
  const mock = registerMock({ fn: serve });
  const captured: { fetch?: (request: Request) => Response | Promise<Response> } = {};

  // honoServeAdapter is called exactly once per test (one server instance); the port/hostname
  // it's called with varies across tests (default 3737, overridden via setServerPort) but does
  // not change what's under test here — capturing the fetch handler regardless of port.
  mock.calledWith([]).implement(((options: {
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
