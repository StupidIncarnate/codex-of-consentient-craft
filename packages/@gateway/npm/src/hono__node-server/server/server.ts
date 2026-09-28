/**
 * PURPOSE: OUR guarded `serve`, the one place `@hono/node-server`'s own listening HTTP server
 * starts from. Narrows the real `Options`/`AddressInfo` shapes down to the `{fetch, port,
 * hostname}` request handler and `{port}` listener every caller in this repo passes — a caller
 * needing a wider `Options` field (TLS, a custom `createServer`) extends this file rather than
 * reaching for the raw npm package. Typed through `Parameters`/`ReturnType` of the real `serve`
 * rather than hand-duplicating its `Options`/`ServerType` union, so a version bump never drifts.
 *
 * USAGE:
 * const server = serve({ fetch: app.fetch, port: 3737, hostname: '0.0.0.0' }, (info) => {
 *   process.stdout.write(`Listening on ${info.port}\n`);
 * });
 * // Returns a real, listening ServerType
 */
import { serve as pkgServe } from '@hono/node-server';

export const serve = (
  options: {
    fetch: (request: Request) => Response | Promise<Response>;
    port: number;
    hostname?: string;
  },
  listeningListener?: (info: { port: number }) => void,
): ReturnType<typeof pkgServe> => pkgServe(options, listeningListener);
