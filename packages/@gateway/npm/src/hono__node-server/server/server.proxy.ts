import { createServer } from 'node:http';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { serve } from './server';

interface CapturedServeOptions {
  fetch: (request: Request) => Response | Promise<Response>;
  port: number;
  hostname?: string;
}

export const serveProxy = (): {
  getCapturedOptions: () => CapturedServeOptions | undefined;
} => {
  const handle = registerMock({ fn: serve });
  const captured: { value?: CapturedServeOptions } = {};

  // ServerInitResponder calls this once per test with a fresh { fetch, port, hostname } — fetch is a
  // closure over that test's own Hono app, so no two calls ever compare equal; [] is the honest
  // address, the same reasoning this same responder's own outboxWatchHandle stages by. Returns a
  // real Node http.Server that is never told to listen — node:http rather than @hono/node-server's
  // own createAdaptorServer, so this stays real even in a caller that module-mocks
  // '@hono/node-server' outright to suppress its own SIGTERM-listener load side effect.
  handle.calledWith([]).implement((options: Parameters<typeof serve>[0]) => {
    captured.value = {
      fetch: options.fetch,
      port: options.port,
      ...(options.hostname === undefined ? {} : { hostname: options.hostname }),
    };
    return createServer();
  });

  return {
    getCapturedOptions: () => captured.value,
  };
};
