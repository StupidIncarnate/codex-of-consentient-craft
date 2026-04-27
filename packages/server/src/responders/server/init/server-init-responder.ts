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
  orchestrationEventTypeContract,
  processIdContract,
  wsMessageContract,
} from '@dungeonmaster/shared/contracts';
import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import {
  portResolveBroker,
  locationsWardResultsPathFindBroker,
} from '@dungeonmaster/shared/brokers';
import { environmentStatics } from '@dungeonmaster/shared/statics';

import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { filePathContract } from '../../../contracts/file-path/file-path-contract';
import { honoCreateNodeWebSocketAdapter } from '../../../adapters/hono/create-node-web-socket/hono-create-node-web-socket-adapter';
import { honoServeAdapter } from '../../../adapters/hono/serve/hono-serve-adapter';
import { orchestratorEventsOnAdapter } from '../../../adapters/orchestrator/events-on/orchestrator-events-on-adapter';
import { orchestratorLoadQuestAdapter } from '../../../adapters/orchestrator/load-quest/orchestrator-load-quest-adapter';
import { orchestratorOutboxWatchAdapter } from '../../../adapters/orchestrator/outbox-watch/orchestrator-outbox-watch-adapter';
import { orchestratorReplayChatHistoryAdapter } from '../../../adapters/orchestrator/replay-chat-history/orchestrator-replay-chat-history-adapter';
import { orchestratorSetWebPresenceAdapter } from '../../../adapters/orchestrator/set-web-presence/orchestrator-set-web-presence-adapter';
import { orchestratorStopAllChatsAdapter } from '../../../adapters/orchestrator/stop-all-chats/orchestrator-stop-all-chats-adapter';
import { orchestratorFindQuestPathAdapter } from '../../../adapters/orchestrator/find-quest-path/orchestrator-find-quest-path-adapter';
import { processDevLogAdapter } from '../../../adapters/process/dev-log/process-dev-log-adapter';
import { wsEventRelayBroadcastBroker } from '../../../brokers/ws-event-relay/broadcast/ws-event-relay-broadcast-broker';
import { devLogEventFormatTransformer } from '../../../transformers/dev-log-event-format/dev-log-event-format-transformer';
import { isoTimestampContract } from '../../../contracts/iso-timestamp/iso-timestamp-contract';
import type { OrchestrationEventType, ProcessId, QuestId } from '@dungeonmaster/shared/contracts';
import type { WsClient } from '../../../contracts/ws-client/ws-client-contract';
import { chatOutputPayloadContract } from '../../../contracts/chat-output-payload/chat-output-payload-contract';
import { wsEventDataContract } from '../../../contracts/ws-event-data/ws-event-data-contract';
import { wsIncomingMessageContract } from '../../../contracts/ws-incoming-message/ws-incoming-message-contract';
import { designProcessState } from '../../../state/design-process/design-process-state';

type HonoApp = Parameters<typeof honoCreateNodeWebSocketAdapter>[0]['app'];

const FLUSH_INTERVAL_MS = 100;

// Per-quest event types route ONLY through the per-quest subscription filter.
// Clients without a matching subscription do not receive these events.
const PER_QUEST_EVENT_TYPES = new Set<OrchestrationEventType>([
  'chat-output',
  'chat-complete',
  'chat-session-started',
  'chat-history-complete',
  'clarification-request',
  'quest-modified',
  'quest-created',
  'quest-session-linked',
]);

export const ServerInitResponder = ({ app }: { app: HonoApp }): AdapterResult => {
  const nodeWebSocket = honoCreateNodeWebSocketAdapter({ app });
  const { upgradeWebSocket } = nodeWebSocket;
  // `clients` carries every connected WS so global events
  // (execution-queue-updated, execution-queue-error, phase-change, slot-update,
  // progress-update, process-complete, process-failed, quest-persisted) can fan out.
  const clients = new Set<WsClient>();
  // Per-quest subscriptions: a client subscribed to questId X receives only the
  // PER_QUEST_EVENT_TYPES events whose payload carries that questId.
  const clientSubscriptions = new Map<WsClient, Set<QuestId>>();

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
          const evtParsed =
            typeof evt === 'object' && evt !== null
              ? wsEventDataContract.safeParse(evt)
              : undefined;
          const evtData = evtParsed?.success ? evtParsed.data.data : undefined;

          const rawJson: unknown =
            typeof evtData === 'string' ? (JSON.parse(evtData) as unknown) : undefined;

          if (typeof rawJson !== 'object' || rawJson === null) return;

          const parsedMessage = wsIncomingMessageContract.safeParse(rawJson);
          if (!parsedMessage.success) return;
          const message = parsedMessage.data;

          if (message.type === 'replay-history') {
            const { sessionId, guildId, chatProcessId } = message;

            orchestratorReplayChatHistoryAdapter({
              sessionId,
              guildId,
              chatProcessId,
            }).catch(() => {
              processDevLogAdapter({ message: 'replay-history failed' });
            });
          }

          if (message.type === 'ward-detail-request') {
            const { questId, wardResultId } = message;

            orchestratorFindQuestPathAdapter({ questId })
              .then(async ({ questPath }) => {
                const detailFilePath = pathJoinAdapter({
                  paths: [
                    locationsWardResultsPathFindBroker({ questFolderPath: questPath }),
                    `${wardResultId}.json`,
                  ],
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

          if (message.type === 'subscribe-quest') {
            const subQuestId = message.questId;
            const subWs = _ws as WsClient;
            const existing = clientSubscriptions.get(subWs) ?? new Set<QuestId>();
            existing.add(subQuestId);
            clientSubscriptions.set(subWs, existing);
            // Replay-on-subscribe — load the quest, replay each work item's session JSONL.
            orchestratorLoadQuestAdapter({ questId: subQuestId })
              .then(async (quest) => {
                const findResult = await orchestratorFindQuestPathAdapter({
                  questId: subQuestId,
                }).catch(() => null);
                const subGuildId = findResult?.guildId;
                if (!subGuildId) return;
                await Promise.all(
                  quest.workItems
                    .filter((wi) => wi.sessionId !== undefined)
                    .map(async (wi) => {
                      if (!wi.sessionId) return;
                      const taggedId = processIdContract.parse(
                        `quest-replay-${subQuestId}-${wi.id}-${wi.sessionId}`,
                      );
                      await orchestratorReplayChatHistoryAdapter({
                        sessionId: wi.sessionId,
                        guildId: subGuildId,
                        chatProcessId: taggedId,
                      }).catch(() => {
                        processDevLogAdapter({
                          message: `replay-quest-history work item ${wi.id} failed`,
                        });
                      });
                    }),
                );
                subWs.send(
                  JSON.stringify(
                    wsMessageContract.parse({
                      type: 'chat-history-complete',
                      payload: { questId: subQuestId },
                      timestamp: isoTimestampContract.parse(new Date().toISOString()),
                    }),
                  ),
                );
              })
              .catch((error: unknown) => {
                const reason =
                  error instanceof Error
                    ? `${error.message}${error.cause ? ` | cause: ${error.cause instanceof Error ? error.cause.message : JSON.stringify(error.cause)}` : ''}`
                    : String(error);
                processDevLogAdapter({
                  message: `subscribe-quest replay failed for ${subQuestId}: ${reason}`,
                });
              });
          }

          if (message.type === 'unsubscribe-quest') {
            const unsubQuestId = message.questId;
            const unsubWs = _ws as WsClient;
            const existing = clientSubscriptions.get(unsubWs);
            if (existing) {
              existing.delete(unsubQuestId);
              if (existing.size === 0) {
                clientSubscriptions.delete(unsubWs);
              }
            }
          }

          if (message.type === 'replay-quest-history') {
            const replayQuestId = message.questId;
            const replayWs = _ws as WsClient;
            orchestratorLoadQuestAdapter({ questId: replayQuestId })
              .then(async (quest) => {
                const findResult = await orchestratorFindQuestPathAdapter({
                  questId: replayQuestId,
                }).catch(() => null);
                const replayGuildId = findResult?.guildId;
                if (!replayGuildId) return;
                await Promise.all(
                  quest.workItems
                    .filter((wi) => wi.sessionId !== undefined)
                    .map(async (wi) => {
                      if (!wi.sessionId) return;
                      const taggedId = processIdContract.parse(
                        `quest-replay-${replayQuestId}-${wi.id}-${wi.sessionId}`,
                      );
                      await orchestratorReplayChatHistoryAdapter({
                        sessionId: wi.sessionId,
                        guildId: replayGuildId,
                        chatProcessId: taggedId,
                      }).catch(() => {
                        processDevLogAdapter({
                          message: `replay-quest-history work item ${wi.id} failed`,
                        });
                      });
                    }),
                );
                replayWs.send(
                  JSON.stringify(
                    wsMessageContract.parse({
                      type: 'chat-history-complete',
                      payload: { questId: replayQuestId },
                      timestamp: isoTimestampContract.parse(new Date().toISOString()),
                    }),
                  ),
                );
              })
              .catch((error: unknown) => {
                const reason =
                  error instanceof Error
                    ? `${error.message}${error.cause ? ` | cause: ${error.cause instanceof Error ? error.cause.message : JSON.stringify(error.cause)}` : ''}`
                    : String(error);
                processDevLogAdapter({
                  message: `replay-quest-history failed for ${replayQuestId}: ${reason}`,
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
        clientSubscriptions.delete(ws as WsClient);
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
        const parsedPayload = chatOutputPayloadContract.safeParse(payload);
        const slotIndexValue = parsedPayload.success ? parsedPayload.data.slotIndex : undefined;
        const payloadQuestId = parsedPayload.success ? parsedPayload.data.questId : undefined;

        processDevLogAdapter({
          message: devLogEventFormatTransformer({
            type,
            payload: payload as Record<PropertyKey, unknown>,
          }),
        });

        if (type === 'chat-output' && typeof slotIndexValue === 'number') {
          pipelineChatOutputBuffer.push({ processId, payload });
          return;
        }

        const envelope = wsMessageContract.parse({
          type,
          payload: { ...payload, processId },
          timestamp: isoTimestampContract.parse(new Date().toISOString()),
        });

        if (PER_QUEST_EVENT_TYPES.has(type)) {
          // Per-quest events fan out ONLY to subscribed clients whose subscription
          // matches the payload's questId.
          if (!payloadQuestId) return;
          const serializedQuestMsg = JSON.stringify(envelope);
          for (const [client, subs] of clientSubscriptions) {
            if (!subs.has(payloadQuestId)) continue;
            try {
              client.send(serializedQuestMsg);
            } catch {
              clientSubscriptions.delete(client);
              clients.delete(client);
            }
          }
          return;
        }

        // Global events broadcast to every connected client.
        wsEventRelayBroadcastBroker({
          clients,
          message: envelope,
        });
      },
    });
  }

  const flushIntervalHandle = setInterval(() => {
    if (pipelineChatOutputBuffer.length === 0) return;

    const batch = pipelineChatOutputBuffer.splice(0);
    for (const item of batch) {
      const flushEnvelope = wsMessageContract.parse({
        type: 'chat-output',
        payload: { ...item.payload, processId: item.processId },
        timestamp: isoTimestampContract.parse(new Date().toISOString()),
      });
      const flushParsed = chatOutputPayloadContract.safeParse(item.payload);
      const flushQuestId = flushParsed.success ? flushParsed.data.questId : undefined;

      // Pipeline-batched chat-output is a per-quest event — fan out only to
      // subscribed clients whose subscription matches the batched payload's questId.
      if (!flushQuestId) continue;
      const serializedFlush = JSON.stringify(flushEnvelope);
      for (const [client, subs] of clientSubscriptions) {
        if (!subs.has(flushQuestId)) continue;
        try {
          client.send(serializedFlush);
        } catch {
          clientSubscriptions.delete(client);
          clients.delete(client);
        }
      }
    }
  }, FLUSH_INTERVAL_MS);

  orchestratorOutboxWatchAdapter({
    onQuestChanged: ({ questId }) => {
      orchestratorLoadQuestAdapter({ questId })
        .then((quest) => {
          const outboxEnvelope = wsMessageContract.parse({
            type: 'quest-modified',
            payload: { questId, quest },
            timestamp: isoTimestampContract.parse(new Date().toISOString()),
          });

          // quest-modified is a per-quest event — only subscribed clients receive it.
          const serializedOutbox = JSON.stringify(outboxEnvelope);
          for (const [client, subs] of clientSubscriptions) {
            if (!subs.has(questId)) continue;
            try {
              client.send(serializedOutbox);
            } catch {
              clientSubscriptions.delete(client);
              clients.delete(client);
            }
          }
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

  // Startup recovery is gated behind first-WS-connect (first flip of web presence to true).
  // The execution-queue bootstrap responder runs the recovery sweep lazily so server restarts
  // without a connected browser don't auto-launch orchestration loops.

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
