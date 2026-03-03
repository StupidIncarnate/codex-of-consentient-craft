/**
 * PURPOSE: Initializes WebSocket, event relay, server listening, and signal handlers for the HTTP server
 *
 * USAGE:
 * ServerInitResponder({ app });
 * // Sets up WebSocket routes, starts serving, subscribes to orchestration events, handles shutdown
 */

import {
  guildIdContract,
  orchestrationEventTypeContract,
  processIdContract,
  questIdContract,
  sessionIdContract,
  wsMessageContract,
} from '@dungeonmaster/shared/contracts';
import { environmentStatics } from '@dungeonmaster/shared/statics';

import { honoCreateNodeWebSocketAdapter } from '../../../adapters/hono/create-node-web-socket/hono-create-node-web-socket-adapter';
import { honoServeAdapter } from '../../../adapters/hono/serve/hono-serve-adapter';
import { orchestratorEventsOnAdapter } from '../../../adapters/orchestrator/events-on/orchestrator-events-on-adapter';
import { orchestratorLoadQuestAdapter } from '../../../adapters/orchestrator/load-quest/orchestrator-load-quest-adapter';
import { orchestratorOutboxWatchAdapter } from '../../../adapters/orchestrator/outbox-watch/orchestrator-outbox-watch-adapter';
import { orchestratorReplayChatHistoryAdapter } from '../../../adapters/orchestrator/replay-chat-history/orchestrator-replay-chat-history-adapter';
import { orchestratorStopAllChatsAdapter } from '../../../adapters/orchestrator/stop-all-chats/orchestrator-stop-all-chats-adapter';
import { processDevLogAdapter } from '../../../adapters/process/dev-log/process-dev-log-adapter';
import { wsEventRelayBroadcastBroker } from '../../../brokers/ws-event-relay/broadcast/ws-event-relay-broadcast-broker';
import { agentOutputLineContract } from '../../../contracts/agent-output-line/agent-output-line-contract';
import { isoTimestampContract } from '../../../contracts/iso-timestamp/iso-timestamp-contract';
import { slotIndexContract } from '../../../contracts/slot-index/slot-index-contract';
import type { WsClient } from '../../../contracts/ws-client/ws-client-contract';
import { agentOutputBufferState } from '../../../state/agent-output-buffer/agent-output-buffer-state';

type HonoApp = Parameters<typeof honoCreateNodeWebSocketAdapter>[0]['app'];

const FLUSH_INTERVAL_MS = 100;

export const ServerInitResponder = ({ app }: { app: HonoApp }): void => {
  const nodeWebSocket = honoCreateNodeWebSocketAdapter({ app });
  const { upgradeWebSocket } = nodeWebSocket;
  const clients = new Set<WsClient>();

  app.get(
    '/ws',
    upgradeWebSocket(() => ({
      onOpen: (_evt: unknown, ws: unknown) => {
        clients.add(ws as WsClient);
        processDevLogAdapter({ message: 'WebSocket client connected' });
      },
      onMessage: (evt: unknown, _ws: unknown) => {
        try {
          const evtData: unknown =
            typeof evt === 'object' && evt !== null ? Reflect.get(evt, 'data') : undefined;

          const raw: unknown =
            typeof evtData === 'string' ? (JSON.parse(evtData) as unknown) : undefined;

          if (typeof raw !== 'object' || raw === null) return;

          const type: unknown = Reflect.get(raw, 'type');

          if (type === 'replay-history') {
            const sessionId = sessionIdContract.parse(Reflect.get(raw, 'sessionId'));
            const guildId = guildIdContract.parse(Reflect.get(raw, 'guildId'));
            const chatProcessId = processIdContract.parse(Reflect.get(raw, 'chatProcessId'));

            orchestratorReplayChatHistoryAdapter({ sessionId, guildId, chatProcessId }).catch(
              () => {
                processDevLogAdapter({ message: 'replay-history failed' });
              },
            );
          }

          if (type === 'quest-data-request') {
            const questId = questIdContract.parse(Reflect.get(raw, 'questId'));

            orchestratorLoadQuestAdapter({ questId })
              .then((quest) => {
                const message = wsMessageContract.parse({
                  type: 'quest-modified',
                  payload: { questId, quest },
                  timestamp: isoTimestampContract.parse(new Date().toISOString()),
                });
                (_ws as WsClient).send(JSON.stringify(message));
              })
              .catch(() => {
                processDevLogAdapter({ message: `quest-data-request failed for ${questId}` });
              });
          }
        } catch {
          processDevLogAdapter({ message: 'WebSocket message parse error' });
        }
      },
      onClose: (_evt: unknown, ws: unknown) => {
        clients.delete(ws as WsClient);
        processDevLogAdapter({ message: 'WebSocket client disconnected' });
      },
    })),
  );

  const serverPort = Number(process.env.DUNGEONMASTER_PORT) || environmentStatics.defaultPort;
  const serverHost = environmentStatics.hostname;

  app.get('/', (c) => c.redirect(`http://${serverHost}:${serverPort + 1}`));

  const server = honoServeAdapter({
    fetch: app.fetch,
    port: serverPort,
    hostname: serverHost,
    onListen: (info) => {
      process.stdout.write(`Server listening on http://${serverHost}:${info.port}\n`);
    },
  });
  nodeWebSocket.injectWebSocket(server);

  const eventTypes = orchestrationEventTypeContract.options;
  for (const type of eventTypes) {
    if (type === 'agent-output') continue;
    if (type === 'quest-modified') continue;
    if (type === 'quest-created') continue;

    orchestratorEventsOnAdapter({
      type,
      handler: ({ processId, payload }) => {
        wsEventRelayBroadcastBroker({
          clients,
          message: wsMessageContract.parse({
            type,
            payload: { ...payload, processId },
            timestamp: isoTimestampContract.parse(new Date().toISOString()),
          }),
        });
      },
    });
  }

  orchestratorEventsOnAdapter({
    type: 'agent-output',
    handler: ({ processId, payload }) => {
      const slotIndex = slotIndexContract.parse(Reflect.get(payload, 'slotIndex'));
      const rawLine = Reflect.get(payload, 'line');
      const line = agentOutputLineContract.parse(typeof rawLine === 'string' ? rawLine : '');

      agentOutputBufferState.addLine({ processId, slotIndex, line });
    },
  });

  setInterval(() => {
    const pending = agentOutputBufferState.flush();

    for (const [processId, slots] of pending) {
      for (const [slotIndex, lines] of slots) {
        wsEventRelayBroadcastBroker({
          clients,
          message: wsMessageContract.parse({
            type: 'agent-output',
            payload: { processId, slotIndex, lines },
            timestamp: isoTimestampContract.parse(new Date().toISOString()),
          }),
        });
      }
    }
  }, FLUSH_INTERVAL_MS);

  orchestratorOutboxWatchAdapter({
    onQuestChanged: ({ questId }) => {
      orchestratorLoadQuestAdapter({ questId })
        .then((quest) => {
          wsEventRelayBroadcastBroker({
            clients,
            message: wsMessageContract.parse({
              type: 'quest-modified',
              payload: { questId, quest },
              timestamp: isoTimestampContract.parse(new Date().toISOString()),
            }),
          });
        })
        .catch(() => {
          processDevLogAdapter({ message: `Outbox quest load failed for ${questId}` });
        });
    },
    onError: ({ error }) => {
      processDevLogAdapter({ message: `Outbox watch error: ${String(error)}` });
    },
  }).catch(() => {
    processDevLogAdapter({ message: 'Outbox watcher failed to start' });
  });

  process.on('SIGTERM', () => {
    processDevLogAdapter({ message: 'Shutting down: killing all chat processes (SIGTERM)' });
    orchestratorStopAllChatsAdapter();
    process.exit(0);
  });
  process.on('SIGINT', () => {
    processDevLogAdapter({ message: 'Shutting down: killing all chat processes (SIGINT)' });
    orchestratorStopAllChatsAdapter();
    process.exit(0);
  });
};
