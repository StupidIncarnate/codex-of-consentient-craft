/**
 * PURPOSE: Initializes WebSocket, event relay, server listening, and signal handlers for the HTTP server
 *
 * USAGE:
 * ServerInitResponder({ app });
 * // Sets up WebSocket routes, starts serving, subscribes to orchestration events, handles shutdown
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';
import {
  adapterResultContract,
  guildIdContract,
  orchestrationEventTypeContract,
  processIdContract,
  questIdContract,
  sessionIdContract,
  wsMessageContract,
} from '@dungeonmaster/shared/contracts';
import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { portResolveBroker } from '@dungeonmaster/shared/brokers';
import { environmentStatics } from '@dungeonmaster/shared/statics';

import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { filePathContract } from '../../../contracts/file-path/file-path-contract';
import { honoCreateNodeWebSocketAdapter } from '../../../adapters/hono/create-node-web-socket/hono-create-node-web-socket-adapter';
import { honoServeAdapter } from '../../../adapters/hono/serve/hono-serve-adapter';
import { orchestratorEventsOnAdapter } from '../../../adapters/orchestrator/events-on/orchestrator-events-on-adapter';
import { orchestratorListQuestsAdapter } from '../../../adapters/orchestrator/list-quests/orchestrator-list-quests-adapter';
import { orchestratorLoadQuestAdapter } from '../../../adapters/orchestrator/load-quest/orchestrator-load-quest-adapter';
import { orchestratorOutboxWatchAdapter } from '../../../adapters/orchestrator/outbox-watch/orchestrator-outbox-watch-adapter';
import { orchestratorReplayChatHistoryAdapter } from '../../../adapters/orchestrator/replay-chat-history/orchestrator-replay-chat-history-adapter';
import { orchestratorRecoverActiveQuestsAdapter } from '../../../adapters/orchestrator/recover-active-quests/orchestrator-recover-active-quests-adapter';
import { orchestratorSetWebPresenceAdapter } from '../../../adapters/orchestrator/set-web-presence/orchestrator-set-web-presence-adapter';
import { orchestratorStopAllChatsAdapter } from '../../../adapters/orchestrator/stop-all-chats/orchestrator-stop-all-chats-adapter';
import { orchestratorFindQuestPathAdapter } from '../../../adapters/orchestrator/find-quest-path/orchestrator-find-quest-path-adapter';
import { processDevLogAdapter } from '../../../adapters/process/dev-log/process-dev-log-adapter';
import { wsEventRelayBroadcastBroker } from '../../../brokers/ws-event-relay/broadcast/ws-event-relay-broadcast-broker';
import { devLogEventFormatTransformer } from '../../../transformers/dev-log-event-format/dev-log-event-format-transformer';
import { isoTimestampContract } from '../../../contracts/iso-timestamp/iso-timestamp-contract';
import type { ProcessId, WorkItemRole } from '@dungeonmaster/shared/contracts';
import type { WsClient } from '../../../contracts/ws-client/ws-client-contract';
import { designProcessState } from '../../../state/design-process/design-process-state';

type HonoApp = Parameters<typeof honoCreateNodeWebSocketAdapter>[0]['app'];

const FLUSH_INTERVAL_MS = 100;

export const ServerInitResponder = ({ app }: { app: HonoApp }): AdapterResult => {
  const nodeWebSocket = honoCreateNodeWebSocketAdapter({ app });
  const { upgradeWebSocket } = nodeWebSocket;
  const clients = new Set<WsClient>();
  const processRoleMap = new Map<ProcessId, WorkItemRole>();

  app.get(
    '/ws',
    upgradeWebSocket(() => ({
      onOpen: (_evt: unknown, ws: unknown) => {
        const wasEmpty = clients.size === 0;
        clients.add(ws as WsClient);
        processDevLogAdapter({ message: 'WebSocket client connected' });
        if (wasEmpty) {
          orchestratorSetWebPresenceAdapter({ isPresent: true });
        }
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

            orchestratorListQuestsAdapter({ guildId })
              .then(async (quests) => {
                const fullQuests = await Promise.all(
                  quests.map(async (q) => orchestratorLoadQuestAdapter({ questId: q.id })),
                );
                for (const fullQuest of fullQuests) {
                  const wi = fullQuest.workItems.find((w) => w.sessionId === sessionId);
                  if (wi?.role) {
                    processRoleMap.set(chatProcessId, wi.role);
                    break;
                  }
                }
              })
              .catch((error: unknown) => {
                processDevLogAdapter({
                  message: `replay role lookup failed: ${error instanceof Error ? error.message : String(error)}`,
                });
              })
              .finally(() => {
                orchestratorReplayChatHistoryAdapter({
                  sessionId,
                  guildId,
                  chatProcessId,
                }).catch(() => {
                  processDevLogAdapter({ message: 'replay-history failed' });
                });
              });
          }

          if (type === 'quest-by-session-request') {
            const sessionId = sessionIdContract.parse(Reflect.get(raw, 'sessionId'));
            const guildId = guildIdContract.parse(Reflect.get(raw, 'guildId'));

            orchestratorListQuestsAdapter({ guildId })
              .then(async (quests) => {
                const match = quests.find((q) => q.activeSessionId === sessionId);

                if (!match) return;

                return orchestratorLoadQuestAdapter({ questId: match.id }).then((quest) => {
                  const message = wsMessageContract.parse({
                    type: 'quest-modified',
                    payload: { questId: match.id, quest },
                    timestamp: isoTimestampContract.parse(new Date().toISOString()),
                  });
                  (_ws as WsClient).send(JSON.stringify(message));
                });
              })
              .catch((error: unknown) => {
                const reason =
                  error instanceof Error
                    ? `${error.message}${error.cause ? ` | cause: ${error.cause instanceof Error ? error.cause.message : JSON.stringify(error.cause)}` : ''}`
                    : String(error);
                processDevLogAdapter({
                  message: `quest-by-session-request failed for session ${sessionId}: ${reason}`,
                });
              });
          }
          if (type === 'ward-detail-request') {
            const questId = questIdContract.parse(Reflect.get(raw, 'questId'));
            const wardResultId = String(Reflect.get(raw, 'wardResultId'));

            orchestratorFindQuestPathAdapter({ questId })
              .then(async ({ questPath }) => {
                const detailFilePath = pathJoinAdapter({
                  paths: [questPath, 'ward-results', `${wardResultId}.json`],
                });

                const contents = await fsReadFileAdapter({
                  filepath: filePathContract.parse(detailFilePath),
                });

                const detail: unknown = JSON.parse(contents);

                (_ws as WsClient).send(
                  JSON.stringify({
                    type: 'ward-detail-response',
                    wardResultId,
                    detail,
                  }),
                );
              })
              .catch((error: unknown) => {
                const reason =
                  error instanceof Error
                    ? `${error.message}${error.cause ? ` | cause: ${error.cause instanceof Error ? error.cause.message : JSON.stringify(error.cause)}` : ''}`
                    : String(error);
                processDevLogAdapter({
                  message: `ward-detail-request failed for quest ${questId}, ward ${wardResultId}: ${reason}`,
                });
              });
          }
        } catch (error: unknown) {
          const reason =
            error instanceof Error
              ? `${error.message}${error.cause ? ` | cause: ${error.cause instanceof Error ? error.cause.message : JSON.stringify(error.cause)}` : ''}`
              : String(error);
          processDevLogAdapter({ message: `WebSocket message parse error: ${reason}` });
        }
      },
      onClose: (_evt: unknown, ws: unknown) => {
        clients.delete(ws as WsClient);
        processDevLogAdapter({ message: 'WebSocket client disconnected' });
        if (clients.size === 0) {
          orchestratorSetWebPresenceAdapter({ isPresent: false });
        }
      },
    })),
  );

  const serverPort = portResolveBroker();
  const serverHost = environmentStatics.hostname;

  app.get('/', (c) => c.redirect(`http://${serverHost}:${Number(serverPort) + 1}`));

  const server = honoServeAdapter({
    fetch: app.fetch,
    port: Number(serverPort),
    hostname: serverHost,
    onListen: (info) => {
      process.stdout.write(`Server listening on http://${serverHost}:${info.port}\n`);
    },
  });
  nodeWebSocket.injectWebSocket(server);

  const pipelineChatOutputBuffer: {
    processId: ProcessId;
    payload: Record<PropertyKey, unknown>;
  }[] = [];

  const eventTypes = orchestrationEventTypeContract.options;
  for (const type of eventTypes) {
    if (type === 'quest-modified') continue;
    if (type === 'quest-created') continue;

    orchestratorEventsOnAdapter({
      type,
      handler: ({ processId, payload }) => {
        const role = processRoleMap.get(processId);
        const enrichedPayload =
          type === 'chat-output' && role && !Reflect.get(payload, 'role')
            ? { ...payload, role }
            : payload;

        if (type === 'chat-history-complete') {
          processRoleMap.delete(processId);
        }

        processDevLogAdapter({
          message: devLogEventFormatTransformer({
            type,
            payload: enrichedPayload as Record<PropertyKey, unknown>,
          }),
        });

        if (type === 'chat-output' && typeof Reflect.get(payload, 'slotIndex') === 'number') {
          pipelineChatOutputBuffer.push({ processId, payload });
          return;
        }

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

  const flushIntervalHandle = setInterval(() => {
    if (pipelineChatOutputBuffer.length === 0) return;

    const batch = pipelineChatOutputBuffer.splice(0);
    for (const item of batch) {
      wsEventRelayBroadcastBroker({
        clients,
        message: wsMessageContract.parse({
          type: 'chat-output',
          payload: { ...item.payload, processId: item.processId },
          timestamp: isoTimestampContract.parse(new Date().toISOString()),
        }),
      });
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
        .catch((error: unknown) => {
          const reason =
            error instanceof Error
              ? `${error.message}${error.cause ? ` | cause: ${error.cause instanceof Error ? error.cause.message : JSON.stringify(error.cause)}` : ''}`
              : String(error);
          processDevLogAdapter({ message: `Outbox quest load failed for ${questId}: ${reason}` });
        });
    },
    onError: ({ error }) => {
      processDevLogAdapter({ message: `Outbox watch error: ${String(error)}` });
    },
  }).catch((error: unknown) => {
    const reason =
      error instanceof Error
        ? `${error.message}${error.cause ? ` | cause: ${error.cause instanceof Error ? error.cause.message : JSON.stringify(error.cause)}` : ''}`
        : String(error);
    processDevLogAdapter({ message: `Outbox watcher failed to start: ${reason}` });
  });

  orchestratorRecoverActiveQuestsAdapter()
    .then((recoveredIds) => {
      if (recoveredIds.length > 0) {
        processDevLogAdapter({
          message: `Startup recovery: re-registered ${String(recoveredIds.length)} active quest(s)`,
        });
      }
    })
    .catch((error: unknown) => {
      const reason =
        error instanceof Error
          ? `${error.message}${error.cause ? ` | cause: ${error.cause instanceof Error ? error.cause.message : JSON.stringify(error.cause)}` : ''}`
          : String(error);
      processDevLogAdapter({ message: `Startup recovery failed: ${reason}` });
    });

  process.on('SIGTERM', () => {
    processDevLogAdapter({ message: 'Shutting down: killing all chat processes (SIGTERM)' });
    clearInterval(flushIntervalHandle);
    orchestratorStopAllChatsAdapter();
    designProcessState.stopAll();
    process.exit(0);
  });
  process.on('SIGINT', () => {
    processDevLogAdapter({ message: 'Shutting down: killing all chat processes (SIGINT)' });
    clearInterval(flushIntervalHandle);
    orchestratorStopAllChatsAdapter();
    designProcessState.stopAll();
    process.exit(0);
  });
  return adapterResultContract.parse({ success: true });
};
