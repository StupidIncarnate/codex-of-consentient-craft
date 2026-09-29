import { createServer } from 'node:http';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { serve } from './server';

interface CapturedServeOptions {
  fetch: (request: Request) => Response | Promise<Response>;
  port: number;
  hostname?: string;
}

export const serveProxy = (): {
  setupListen: (params: { port: number; hostname?: string }) => void;
  getCapturedOptions: () => CapturedServeOptions | undefined;
} => {
  const handle = registerMock({ fn: serve });
  const captured: { value?: CapturedServeOptions } = {};

  return {
    // Addressed by the port (and hostname, when given) the caller knows it will listen on; a serve
    // call for any other port is unstaged. fetch is a closure over the caller's own Hono app, so it
    // is captured, not keyed. Returns a real Node http.Server that is never told to listen —
    // node:http rather than @hono/node-server's own createAdaptorServer, so this stays real even in
    // a caller that module-mocks '@hono/node-server' outright to suppress its SIGTERM-listener load
    // side effect.
    setupListen: ({ port, hostname }: { port: number; hostname?: string }): void => {
      handle
        .calledWith([
          (options: Parameters<typeof serve>[0]) =>
            options.port === port && (hostname === undefined || options.hostname === hostname),
        ])
        .implement((options: Parameters<typeof serve>[0]) => {
          captured.value = {
            fetch: options.fetch,
            port: options.port,
            ...(options.hostname === undefined ? {} : { hostname: options.hostname }),
          };
          return createServer();
        });
    },
    getCapturedOptions: () => captured.value,
  };
};
