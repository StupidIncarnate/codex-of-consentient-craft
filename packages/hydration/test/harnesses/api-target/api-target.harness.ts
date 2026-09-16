/**
 * PURPOSE: Runs a real `node:http` server on an ephemeral port, so an integration test can drive a
 * genuine refused connection and a genuine non-2xx response with a real body. Reach for this in any
 * `api`-route integration test instead of `fetch-post-adapter.proxy.ts`'s mocked `fetch`: a mock
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
import { createServer } from 'node:http';
import type { Server } from 'node:http';
import { NetworkPortStub } from '@dungeonmaster/shared/contracts';
import type { NetworkPort } from '@dungeonmaster/shared/contracts';
import { HydrationTargetStub } from '../../../src/contracts/hydration-target/hydration-target.stub';
import { HttpResponseStub } from '../../../src/contracts/http-response/http-response.stub';
import type { HydrationTarget } from '../../../src/contracts/hydration-target/hydration-target-contract';
import type { HttpResponse } from '../../../src/contracts/http-response/http-response-contract';

interface ApiTargetHarness {
  beforeEach: () => Promise<void>;
  afterEach: () => Promise<void>;
  answerNext: ({ status, body }: { status: number; body: string }) => void;
  target: () => HydrationTarget;
  url: ({ path }: { path: string }) => HttpResponse['url'];
  refusedUrl: ({ path }: { path: string }) => HttpResponse['url'];
}

export const apiTargetHarness = (): ApiTargetHarness => {
  let server: Server | null = null;
  let listeningPort: NetworkPort | null = null;
  let closedPort: NetworkPort | null = null;
  let nextStatus: HttpResponse['status'] = HttpResponseStub().status;
  let nextBody: HttpResponse['body'] = HttpResponseStub().body;

  return {
    beforeEach: async (): Promise<void> =>
      new Promise((resolve, reject) => {
        nextStatus = HttpResponseStub().status;
        nextBody = HttpResponseStub().body;

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
          listeningPort =
            typeof address === 'object' && address !== null
              ? NetworkPortStub({ value: address.port })
              : null;

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
                ? NetworkPortStub({ value: throwawayAddress.port })
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
      const answered = HttpResponseStub({ status, body });
      nextStatus = answered.status;
      nextBody = answered.body;
    },

    target: (): HydrationTarget => {
      if (listeningPort === null) {
        throw new Error('apiTargetHarness.target: called before beforeEach ran');
      }
      return HydrationTargetStub({ baseUrl: `http://127.0.0.1:${String(listeningPort)}` });
    },

    url: ({ path }: { path: string }): HttpResponse['url'] => {
      if (listeningPort === null) {
        throw new Error('apiTargetHarness.url: called before beforeEach ran');
      }
      return HttpResponseStub({ url: `http://127.0.0.1:${String(listeningPort)}${path}` }).url;
    },

    refusedUrl: ({ path }: { path: string }): HttpResponse['url'] => {
      if (closedPort === null) {
        throw new Error('apiTargetHarness.refusedUrl: called before beforeEach ran');
      }
      return HttpResponseStub({ url: `http://127.0.0.1:${String(closedPort)}${path}` }).url;
    },
  };
};
