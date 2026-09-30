/**
 * PURPOSE: Runs a real `node:http` server on an ephemeral port, so an integration test can drive a
 * genuine refused connection and a genuine non-2xx response with a real body. Reach for this in any
 * `api`-route integration test instead of a mocked `fetch`: a mock
 * always answers something, so it cannot refuse a connection the way a closed socket does, and it
 * cannot prove a body a real server wrote survives byte for byte.
 *
 * USAGE:
 * const harness = apiTargetHarness();
 * // harness.beforeEach / harness.afterEach are auto-wired by the ts-jest harness transformer
 * harness.answerNext({ status: 500, body: '{"error":"database unavailable"}' });
 * const target = harness.target();                            // real { baseUrl }
 * harness.url({ path: '/api/guilds' });                        // a URL the real server answers
 * harness.refusedUrl({ path: '/api/guilds' });                 // a URL nothing is listening on
 */
import { createServer } from '#gateway/node/http';
import type { Server } from '#gateway/node/http';
import { HydrationTargetStub } from '../../../src/contracts/hydration-target/hydration-target.stub';
import type { HydrationTarget } from '../../../src/contracts/hydration-target/hydration-target-contract';

const DEFAULT_STATUS = 200;
const DEFAULT_BODY = '{"id":"g1"}';

interface ApiTargetHarness {
  beforeEach: () => Promise<void>;
  afterEach: () => Promise<void>;
  answerNext: ({ status, body }: { status: number; body: string }) => void;
  target: () => HydrationTarget;
  url: ({ path }: { path: string }) => string;
  refusedUrl: ({ path }: { path: string }) => string;
}

export const apiTargetHarness = (): ApiTargetHarness => {
  let server: Server | null = null;
  let listeningPort: number | null = null;
  let closedPort: number | null = null;
  let nextStatus = DEFAULT_STATUS;
  let nextBody = DEFAULT_BODY;

  return {
    beforeEach: async (): Promise<void> =>
      new Promise((resolve, reject) => {
        nextStatus = DEFAULT_STATUS;
        nextBody = DEFAULT_BODY;

        const created = createServer((request, response) => {
          request.resume();
          request.on('end', () => {
            response.writeHead(nextStatus, { 'Content-Type': 'application/json' });
            response.end(nextBody);
          });
        });
        created.on('error', reject);
        created.listen(0, '127.0.0.1', () => {
          server = created;
          const address = created.address();
          listeningPort = typeof address === 'object' && address !== null ? address.port : null;

          // A second server, opened then immediately closed, hands back a port the OS just proved
          // free — the one honest way to get a real ECONNREFUSED rather than guessing a number. A
          // fixed low port (1, 7, 9, …) will not do: `fetch` itself refuses those as browser-style
          // "bad ports" before any socket is ever opened, which is a different failure than the one
          // sad-path row 1 names.
          const throwaway = createServer();
          throwaway.on('error', reject);
          throwaway.listen(0, '127.0.0.1', () => {
            const throwawayAddress = throwaway.address();
            closedPort =
              typeof throwawayAddress === 'object' && throwawayAddress !== null
                ? throwawayAddress.port
                : null;
            throwaway.close(() => {
              resolve();
            });
          });
        });
      }),

    afterEach: async (): Promise<void> =>
      new Promise((resolve, reject) => {
        if (server === null) {
          resolve();
          return;
        }
        const active = server;
        server = null;
        active.close((closeError) => {
          listeningPort = null;
          closedPort = null;
          if (closeError) {
            reject(closeError);
            return;
          }
          resolve();
        });
      }),

    answerNext: ({ status, body }: { status: number; body: string }): void => {
      nextStatus = status;
      nextBody = body;
    },

    target: (): HydrationTarget => {
      if (listeningPort === null) {
        throw new Error('apiTargetHarness.target: called before beforeEach ran');
      }
      return HydrationTargetStub({ baseUrl: `http://127.0.0.1:${String(listeningPort)}` });
    },

    url: ({ path }: { path: string }): string => {
      if (listeningPort === null) {
        throw new Error('apiTargetHarness.url: called before beforeEach ran');
      }
      return `http://127.0.0.1:${String(listeningPort)}${path}`;
    },

    refusedUrl: ({ path }: { path: string }): string => {
      if (closedPort === null) {
        throw new Error('apiTargetHarness.refusedUrl: called before beforeEach ran');
      }
      return `http://127.0.0.1:${String(closedPort)}${path}`;
    },
  };
};
