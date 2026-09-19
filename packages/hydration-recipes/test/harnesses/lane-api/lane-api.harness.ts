/**
 * PURPOSE: A REAL HTTP server answering the one route a `direct` recipe reads — `GET /api/guilds`.
 * Nothing about a recipe's own behaviour is mocked here: it makes a real request over a real
 * socket, which is what keeps the integration test an integration test while still costing a
 * socket rather than a booted instance.
 *
 * USAGE:
 * const laneApi = laneApiHarness();
 * laneApi.serveGuild({ id, path, urlSlug });
 * await sessionWithNestedSubagentSeedBroker({ context: RecipeContextStub({ apiBaseUrl: laneApi.baseUrl() }) });
 */

import { createServer } from 'http';
import type { Server } from 'http';

import { ContentTextStub, GuildStub } from '@dungeonmaster/shared/contracts';

export const laneApiHarness = (): {
  beforeEach: () => Promise<void>;
  afterEach: () => Promise<void>;
  serveGuild: (params: { id: string; path: string; urlSlug: string }) => void;
  baseUrl: () => ReturnType<typeof ContentTextStub>;
} => {
  const state: {
    server: Server | null;
    origin: ReturnType<typeof ContentTextStub>;
    guilds: unknown[];
  } = {
    server: null,
    origin: ContentTextStub({ value: '' }),
    guilds: [],
  };

  return {
    beforeEach: async (): Promise<void> => {
      state.guilds = [];
      await new Promise<void>((resolve) => {
        const server = createServer((_request, response) => {
          response.writeHead(200, { 'Content-Type': 'application/json' });
          response.end(JSON.stringify(state.guilds));
        });
        state.server = server;
        server.listen(0, '127.0.0.1', () => {
          const address = server.address();
          const port = typeof address === 'object' && address !== null ? address.port : 0;
          state.origin = ContentTextStub({ value: `http://127.0.0.1:${String(port)}` });
          resolve();
        });
      });
    },

    afterEach: async (): Promise<void> => {
      const { server } = state;
      state.server = null;
      await new Promise<void>((resolve) => {
        if (server === null) {
          resolve();
          return;
        }
        server.close(() => {
          resolve();
        });
      });
    },

    serveGuild: ({ id, path, urlSlug }: { id: string; path: string; urlSlug: string }): void => {
      state.guilds = [GuildStub({ id, path, urlSlug })];
    },

    baseUrl: (): ReturnType<typeof ContentTextStub> => state.origin,
  };
};
