/**
 * PURPOSE: A real, listening HTTP server standing in for the live instance a `baseUrl` target
 * points at — the "stub HTTP server" tier `get-testing-patterns` sanctions for an external
 * dependency with no in-process test mode. `dmHttpRequestAdapter` falls through to the global
 * `fetch` the moment a target carries a `baseUrl` and no `request` override, and
 * `recipesSeedRunBroker` never sets one, so proving a seed run's `baseUrl` reaches the `api` route
 * for real needs a real socket, not a mocked `fetch` — `enforce-project-structure` refuses a
 * `.integration.test.ts` importing any `.proxy.ts` at all, and `recipes-seed-run-broker.proxy.ts`
 * already documents there is "no I/O boundary to stage" for exactly this reason.
 *
 * `start()` and `lastRequest()` both return `unknown` rather than a hand-typed `{method, path,
 * body}` shape: `@dungeonmaster/ban-primitives` requires a RETURN to be branded, and a raw HTTP
 * method/path/URL has no contract in this package to brand it with — every existing one
 * (`dmTargetContract`'s own internal `urlContract`) is a private, unexported detail of a single
 * field. Handing the caller `unknown` and letting the caller's own `toStrictEqual`/`String(...)`
 * narrow it is the same shape `dmHttpResponseContract`'s own `body: z.unknown()` already uses for
 * an HTTP payload nothing here can brand honestly.
 *
 * Reach for this over `fileTargetHarness` when a test drives the `api` route rather than `write`;
 * the two are never both needed by the same test, since a `baseUrl` target routes every
 * api-declaring ingredient off disk entirely.
 *
 * Created once at `describe` scope, like every harness in this package —
 * `beforeEach`/`afterEach` are properties the AST transformer wires into real jest hooks. `start()`
 * is only valid to call between the two, and only once per test: a fresh ephemeral port is bound
 * each call.
 *
 * USAGE:
 * describe('...', () => {
 *   const instanceStub = instanceStubHarness();
 *   it('VALID: {} => posts to the real path', async () => {
 *     const baseUrl = String(await instanceStub.start({ status: 201, body: { id: 'x' } }));
 *     // ... call code that fetches `${baseUrl}/api/quests` ...
 *     expect(instanceStub.lastRequest()).toStrictEqual({
 *       method: 'POST',
 *       path: '/api/quests',
 *       body: { title: 'x' },
 *     });
 *   });
 * });
 */
import * as http from 'node:http';
import type { Server } from 'node:http';

const LOOPBACK_HOST = '127.0.0.1';

export const instanceStubHarness = (): {
  beforeEach: () => void;
  afterEach: () => Promise<void>;
  start: (params: { status: number; body: unknown }) => Promise<unknown>;
  lastRequest: () => unknown;
} => {
  let server: Server | undefined;
  let recorded: unknown = null;

  return {
    beforeEach: (): void => {
      recorded = null;
      server = undefined;
    },
    afterEach: async (): Promise<void> =>
      new Promise<void>((resolve) => {
        if (server === undefined) {
          resolve();
          return;
        }
        server.close(() => {
          resolve();
        });
      }),
    start: async ({ status, body }: { status: number; body: unknown }): Promise<unknown> =>
      new Promise<unknown>((resolve, reject) => {
        const newServer = http.createServer((req, res) => {
          const chunks: Buffer[] = [];
          req.on('data', (chunk: Buffer) => chunks.push(chunk));
          req.on('end', () => {
            const rawBody = Buffer.concat(chunks).toString('utf8');
            recorded = {
              method: req.method ?? '',
              path: req.url ?? '',
              body: rawBody === '' ? null : (JSON.parse(rawBody) as unknown),
            };
            res.writeHead(status, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(body));
          });
        });
        newServer.on('error', reject);
        newServer.listen(0, LOOPBACK_HOST, () => {
          server = newServer;
          const address = newServer.address();
          if (address === null || typeof address === 'string') {
            reject(new Error('instanceStubHarness: failed to bind an ephemeral port'));
            return;
          }
          resolve(`http://${LOOPBACK_HOST}:${String(address.port)}`);
        });
      }),
    lastRequest: (): unknown => recorded,
  };
};
