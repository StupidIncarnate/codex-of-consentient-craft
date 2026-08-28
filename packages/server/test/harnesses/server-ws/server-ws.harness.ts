/**
 * PURPOSE: Boots the REAL ServerFlow on a free port under a temp DUNGEONMASTER_HOME so a suite can
 * open genuine `/ws` client sockets and read frames a real heartbeat interval pushes over them.
 * Every existing `/ws` coverage runs through server-init-responder.proxy.ts, which replaces BOTH
 * npm transports (`@hono/node-server`'s `serve` via a full module mock, `@hono/node-ws`'s
 * `createNodeWebSocket` via its own adapter proxy) — this is the one place a test completes a real
 * WebSocket upgrade instead of simulating a connection through a captured handler map. Reach for
 * this over server-app.harness.ts (which it composes for the temp home) when the suite needs a
 * live socket rather than a plain fetch through a captured Hono handler.
 *
 * Neither `@hono/node-server`'s own `serve` export nor Node's native `http.createServer` can be
 * intercepted here: both throw `Cannot redefine property` under jest.spyOn on this Node version,
 * and a registerMock module mock only ever hoists into a file reached through a `.proxy` import —
 * which harnesses are barred from importing (lint-enforced: "Harnesses and proxies use different
 * mock mechanisms"). So this harness never intercepts the transport at all: it calls the REAL
 * ServerFlow fully unmocked, then finds the listener it just bound by scanning
 * `process._getActiveHandles()` (a real, long-standing Node API that is deliberately
 * undocumented and absent from `@types/node`) for a `net.Server` whose own
 * `.address().port` matches the free port this harness chose. That IS the handle
 * ServerInitResponder's `nodeWebSocket.injectWebSocket` attached the `/ws` upgrade to, so closing
 * it in afterEach closes the genuine listener.
 *
 * USAGE:
 * const serverWs = serverWsHarness();
 * await serverWs.start();
 * const client = await serverWs.openClient();
 * client.send(JSON.stringify({ type: 'subscribe-quest', questId }));
 * const frame = await client.waitForHealthStatusFrame({ timeoutMs: 15000 });
 * // frame.payload.uptimeSeconds / .version / frame.timestamp
 */
import { Server } from 'net';

import WebSocketClient from 'ws';

import { netFreePortAdapter } from '@dungeonmaster/shared/adapters';
import {
  contentTextContract,
  healthStatusPayloadContract,
  orchestrationEventTypeContract,
  wsMessageContract,
} from '@dungeonmaster/shared/contracts';
import type { ContentText, NetworkPort } from '@dungeonmaster/shared/contracts';
import { environmentStatics } from '@dungeonmaster/shared/statics';

import { ServerFlow } from '../../../src/flows/server/server-flow';
import { serverAppHarness } from '../server-app/server-app.harness';

// `_getActiveHandles` is a real, long-standing Node API that @types/node does not declare (it is
// intentionally undocumented). Read through a Record utility type keyed on the literal method
// name, rather than an inline `{ _getActiveHandles: ... }` cast, at the single call site below.
const processGetActiveHandles = (): readonly unknown[] =>
  (process as unknown as Record<'_getActiveHandles', () => readonly unknown[]>)._getActiveHandles();

const HEALTH_STATUS_POLL_INTERVAL_MS = 200;
const FIND_SERVER_POLL_INTERVAL_MS = 50;

// Every frame the server sends already went through wsMessageContract.parse() on its way out
// (server-init-responder.ts), so re-parsing a collected frame through the same contract here
// never throws on a real frame — it only ever narrows `payload` from `unknown` to the shape this
// harness's callers need.
const parseHealthStatusFrame = (raw: ContentText) => {
  const envelope = wsMessageContract.parse(JSON.parse(raw));
  const payload = healthStatusPayloadContract.parse(envelope.payload);
  return { type: envelope.type, payload, timestamp: envelope.timestamp };
};

// Recursive poll (never while(true)) of Node's own active-handle list for the REAL net.Server
// ServerFlow just bound.
const findListeningServerByPort = async (params: {
  port: NetworkPort;
  deadline: number;
}): Promise<Server> => {
  const { port, deadline } = params;
  const activeHandles = processGetActiveHandles();
  const found = activeHandles.find((handle): handle is Server => {
    if (!(handle instanceof Server) || !handle.listening) {
      return false;
    }
    const address = handle.address();
    return typeof address === 'object' && address !== null && address.port === port;
  });
  if (found !== undefined) {
    return found;
  }
  if (Date.now() >= deadline) {
    const listeningPorts = activeHandles
      .filter((handle): handle is Server => handle instanceof Server && handle.listening)
      .map((handle) => {
        const address = handle.address();
        return typeof address === 'object' && address !== null ? String(address.port) : 'unknown';
      });
    throw new Error(
      `server-ws harness: no listening server found on port ${String(port)} before the deadline; ` +
        `active listening servers were on ports [${listeningPorts.join(', ')}]`,
    );
  }
  await new Promise((resolve) => {
    setTimeout(resolve, FIND_SERVER_POLL_INTERVAL_MS);
  });
  return findListeningServerByPort({ port, deadline });
};

// Recursive poll (never while(true)) for the first collected frame whose `type` is
// 'health-status'. A subscribed client also receives its own subscribe-quest reply
// (quest-modified or quest-load-failed) before any heartbeat, so callers must filter by type
// rather than read the first collected message.
const pollForHealthStatusFrame = async (params: {
  getMessages: () => readonly ContentText[];
  deadline: number;
}): Promise<ReturnType<typeof parseHealthStatusFrame>> => {
  const { getMessages, deadline } = params;
  const found = getMessages().find(
    (raw) =>
      wsMessageContract.parse(JSON.parse(raw)).type ===
      orchestrationEventTypeContract.enum['health-status'],
  );
  if (found !== undefined) {
    return parseHealthStatusFrame(found);
  }
  if (Date.now() >= deadline) {
    const collectedTypes = getMessages().map(
      (raw) => wsMessageContract.parse(JSON.parse(raw)).type,
    );
    throw new Error(
      'server-ws harness: no health-status frame arrived before the deadline; ' +
        `this client collected ${String(collectedTypes.length)} frame(s) of type ` +
        `[${collectedTypes.join(', ')}]`,
    );
  }
  await new Promise((resolve) => {
    setTimeout(resolve, HEALTH_STATUS_POLL_INTERVAL_MS);
  });
  return pollForHealthStatusFrame({ getMessages, deadline });
};

export const serverWsHarness = (): {
  afterEach: () => Promise<void>;
  start: () => Promise<void>;
  openClient: () => Promise<{
    send: (data: string) => void;
    getMessages: () => readonly ContentText[];
    waitForHealthStatusFrame: (params: {
      timeoutMs: number;
    }) => Promise<ReturnType<typeof parseHealthStatusFrame>>;
  }>;
} => {
  let capturedServer: Server | undefined;
  let boundPort: NetworkPort | undefined;
  let restoreHome: (() => void) | undefined;
  let restorePort: (() => void) | undefined;
  const openSockets: WebSocketClient[] = [];

  return {
    start: async (): Promise<void> => {
      restoreHome = serverAppHarness().setupTestHome({ baseName: 'server-ws-harness' });

      const savedPort = process.env.DUNGEONMASTER_PORT;
      // netFreePortAdapter binds port 0 on every interface and closes the probe before the real
      // server binds, so DUNGEONMASTER_PORT never collides with a dogfood server holding 3737 —
      // and never with a port that is free on loopback but taken on the address
      // environmentStatics.hostname actually resolves to.
      const freePort = await netFreePortAdapter();
      boundPort = freePort;
      process.env.DUNGEONMASTER_PORT = String(freePort);
      restorePort = (): void => {
        if (savedPort === undefined) {
          Reflect.deleteProperty(process.env, 'DUNGEONMASTER_PORT');
        } else {
          process.env.DUNGEONMASTER_PORT = savedPort;
        }
      };

      // Leftover SIGTERM/SIGINT handlers from a previous real boot in this same worker would
      // otherwise accumulate past Node's default max-listener warning threshold.
      process.removeAllListeners('SIGTERM');
      process.removeAllListeners('SIGINT');

      // Fully real, unmocked boot — see the file header for why this harness cannot intercept
      // the transport.
      ServerFlow({ subApps: [] });

      capturedServer = await findListeningServerByPort({
        port: freePort,
        deadline: Date.now() + 10000,
      });
    },

    openClient: async (): Promise<{
      send: (data: string) => void;
      getMessages: () => readonly ContentText[];
      waitForHealthStatusFrame: (params: {
        timeoutMs: number;
      }) => Promise<ReturnType<typeof parseHealthStatusFrame>>;
    }> => {
      if (boundPort === undefined) {
        throw new Error('server-ws harness: call start() before openClient()');
      }
      const messages: ContentText[] = [];
      // ServerInitResponder binds via environmentStatics.hostname ('dungeonmaster.localhost'),
      // not '127.0.0.1' — connecting to a plain loopback literal here hits ECONNREFUSED because
      // it is a different address than the one the OS actually bound the listener to.
      const socket = new WebSocketClient(
        `ws://${environmentStatics.hostname}:${String(boundPort)}/ws`,
      );
      openSockets.push(socket);

      await new Promise<void>((resolve, reject) => {
        socket.once('open', () => {
          resolve();
        });
        socket.once('error', (error) => {
          reject(new Error(`server-ws harness: client socket failed to open: ${error.message}`));
        });
      });

      socket.on('message', (data) => {
        messages.push(contentTextContract.parse(String(data)));
      });

      return {
        send: (data: string): void => {
          socket.send(data);
        },
        getMessages: (): readonly ContentText[] => messages,
        waitForHealthStatusFrame: async ({
          timeoutMs,
        }: {
          timeoutMs: number;
        }): Promise<ReturnType<typeof parseHealthStatusFrame>> =>
          pollForHealthStatusFrame({
            getMessages: () => messages,
            deadline: Date.now() + timeoutMs,
          }),
      };
    },

    afterEach: async (): Promise<void> => {
      for (const socket of openSockets) {
        socket.close();
      }
      openSockets.length = 0;

      const serverToClose = capturedServer;
      capturedServer = undefined;
      await new Promise<void>((resolve) => {
        if (serverToClose === undefined) {
          resolve();
          return;
        }
        serverToClose.close(() => {
          resolve();
        });
      });

      restorePort?.();
      restorePort = undefined;
      boundPort = undefined;

      restoreHome?.();
      restoreHome = undefined;
    },
  };
};
