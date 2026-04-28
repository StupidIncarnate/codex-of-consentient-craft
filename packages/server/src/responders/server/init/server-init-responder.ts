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
import { questWaitForSessionStampBroker } from '../../../brokers/quest/wait-for-session-stamp/quest-wait-for-session-stamp-broker';
import { wsEventRelayBroadcastBroker } from '../../../brokers/ws-event-relay/broadcast/ws-event-relay-broadcast-broker';
import { devLogEventFormatTransformer } from '../../../transformers/dev-log-event-format/dev-log-event-format-transformer';
import { isoTimestampContract } from '../../../contracts/iso-timestamp/iso-timestamp-contract';
import type {
  OrchestrationEventType,
  ProcessId,
  QuestId,
  QuestWorkItemId,
  WsMessage,
} from '@dungeonmaster/shared/contracts';
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
  // Per-quest replay-in-progress flags. While a (client, questId) pair is in
  // this map, live PER_QUEST_EVENT_TYPES events for that questId are NOT
  // forwarded to that client through the per-quest path; instead chat-output
  // frames are buffered (see bufferedDuringReplay below) and delivered after
  // the replay window IFF replay produced no chat-output of its own (race lost
  // — JSONL not yet written when subscribe arrived). This guards against the
  // pure-loss case where live emits during replay are suppressed AND replay
  // reads an empty JSONL — the test sees nothing and times out. Cleared when
  // chat-history-complete fires for the subscribe-quest replay (or replay errors out).
  const replayInProgressByClient = new Map<WsClient, Set<QuestId>>();
  // Live chat-output frames suppressed during a replay window, keyed by
  // (client, questId, workItemId). Drained in the subscribe-quest .finally:
  // for each workItem, deliver buffered frames ONLY IF replay produced no
  // chat-output for that workItem (replay raced an unwritten JSONL). Frames
  // for workItems where replay succeeded are dropped to prevent dupes between
  // live + replay paths. Per-workItem because some workItems' replays may
  // succeed while others fail — coarse-grain (per-quest) tracking would drop
  // legitimately race-lost frames whenever ANY replay in the quest succeeded.
  // Frames without workItemId go under the null key.
  const bufferedDuringReplay = new Map<
    WsClient,
    Map<QuestId, Map<QuestWorkItemId | null, WsMessage[]>>
  >();
  // WorkItemIds for which replay's direct-send delivered at least one chat-output
  // frame, per (client, questId). Used by the subscribe-quest .finally to decide
  // which workItem buffers to drain.
  const replayDeliveredWorkItems = new Map<WsClient, Map<QuestId, Set<QuestWorkItemId | null>>>();
  // Readonly-replay routing: when a client sends `replay-history` (SessionViewWidget
  // mounted on `/:guildSlug/session/:sessionId`), we track its chatProcessId here so
  // chat-output / chat-history-complete events stamped with that chatProcessId can be
  // forwarded DIRECTLY to that client. Without this, orphan-session chat-output (no
  // questId) would be filtered out by the per-quest broadcast filter and the readonly
  // viewer page would hang on the loading state forever. The entry is removed when
  // chat-history-complete fires for that chatProcessId, or when the client disconnects.
  const replayClientByChatProcessId = new Map<ProcessId, WsClient>();

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
            const replayWs = _ws as WsClient;
            // Track the requesting client so chat-output / chat-history-complete events
            // emitted by ChatReplayResponder for this chatProcessId can be routed DIRECTLY
            // back to the SessionViewWidget — bypassing the per-quest broadcast filter
            // which would otherwise drop orphan-session frames (no questId stamped).
            replayClientByChatProcessId.set(chatProcessId, replayWs);

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
            // Mark this (client, questId) pair as currently replaying so live
            // chat-output emissions for the same questId are NOT forwarded to
            // this client during the replay window — without this gate, the
            // orchestrator's live emission AND the JSONL replay would deliver
            // the same chat line to the client twice.
            const replayingForClient = replayInProgressByClient.get(subWs) ?? new Set<QuestId>();
            replayingForClient.add(subQuestId);
            replayInProgressByClient.set(subWs, replayingForClient);
            // Track every chatProcessId we use for this replay so chat-output
            // events stamped with those IDs route to subWs via the direct-send
            // path (per-quest delivery is suppressed for this client by the flag
            // above to prevent live + replay duplicates).
            const replayChatProcessIds: ProcessId[] = [];
            // Replay-on-subscribe — load the quest, replay each work item's session JSONL.
            orchestratorLoadQuestAdapter({ questId: subQuestId })
              .then(async (quest) => {
                // Send current quest state to the subscribing client BEFORE replay.
                // Without this, completed quests (no longer being modified) would
                // never deliver quest data to a freshly subscribed client.
                subWs.send(
                  JSON.stringify(
                    wsMessageContract.parse({
                      type: 'quest-modified',
                      payload: { questId: subQuestId, quest },
                      timestamp: isoTimestampContract.parse(new Date().toISOString()),
                    }),
                  ),
                );
                // Wait for the chaoswhisperer/glyphsmith workItem to have its sessionId
                // stamped before walking workItems for replay. New-chat flow's stamp is
                // async (chat-spawn-broker fires questModifyBroker after the CLI's first
                // init line resolves), so a subscribe arriving in that ~100ms window sees
                // pending workItems with no sessionId and skips them — chat-output that
                // was emitted before subscribe (no live subscriber yet) is then lost
                // forever. The broker exits early when no relevant workItem is still
                // un-stamped (the common case) or when its budget elapses.
                const questForReplay = await questWaitForSessionStampBroker({
                  questId: subQuestId,
                  current: quest,
                });
                const findResult = await orchestratorFindQuestPathAdapter({
                  questId: subQuestId,
                }).catch(() => null);
                const subGuildId = findResult?.guildId;
                if (subGuildId) {
                  await Promise.all(
                    questForReplay.workItems
                      .filter((wi) => wi.sessionId !== undefined)
                      .map(async (wi) => {
                        if (!wi.sessionId) return;
                        const taggedId = processIdContract.parse(
                          `quest-replay-${subQuestId}-${wi.id}-${wi.sessionId}`,
                        );
                        replayChatProcessIds.push(taggedId);
                        replayClientByChatProcessId.set(taggedId, subWs);
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
                }
              })
              .catch((error: unknown) => {
                const reason =
                  error instanceof Error
                    ? `${error.message}${error.cause ? ` | cause: ${error.cause instanceof Error ? error.cause.message : JSON.stringify(error.cause)}` : ''}`
                    : String(error);
                processDevLogAdapter({
                  message: `subscribe-quest replay failed for ${subQuestId}: ${reason}`,
                });
              })
              .finally(() => {
                const replayingForClientFinish = replayInProgressByClient.get(subWs);
                if (replayingForClientFinish) {
                  replayingForClientFinish.delete(subQuestId);
                  if (replayingForClientFinish.size === 0) {
                    replayInProgressByClient.delete(subWs);
                  }
                }
                for (const replayProcessId of replayChatProcessIds) {
                  replayClientByChatProcessId.delete(replayProcessId);
                }
                // Drain the live-frame buffer per workItem. For each workItem
                // whose replay produced no chat-output (race lost — JSONL
                // unwritten when subscribe arrived), deliver buffered live
                // frames — they're the only source. For workItems whose replay
                // delivered content, drop the buffer (replay covered the same
                // content; delivering buffered would dupe).
                const questDelivered = replayDeliveredWorkItems.get(subWs);
                const deliveredSet = questDelivered?.get(subQuestId);
                if (questDelivered) {
                  questDelivered.delete(subQuestId);
                  if (questDelivered.size === 0) replayDeliveredWorkItems.delete(subWs);
                }
                const questBuffer = bufferedDuringReplay.get(subWs);
                const workItemBuffer = questBuffer?.get(subQuestId);
                if (questBuffer) {
                  questBuffer.delete(subQuestId);
                  if (questBuffer.size === 0) bufferedDuringReplay.delete(subWs);
                }
                let drainSendFailed = false;
                if (workItemBuffer) {
                  for (const [workItemKey, msgs] of workItemBuffer) {
                    if (deliveredSet?.has(workItemKey)) continue;
                    for (const msg of msgs) {
                      try {
                        subWs.send(JSON.stringify(msg));
                      } catch {
                        clientSubscriptions.delete(subWs);
                        clients.delete(subWs);
                        drainSendFailed = true;
                        break;
                      }
                    }
                    if (drainSendFailed) break;
                  }
                }
                // chat-history-complete is sent LAST — after every replay frame
                // and every drained live frame for this subscription. Web's
                // `useQuestChatBinding` flips `isStreaming` on each chat-output
                // (TRUE) and on each chat-history-complete (FALSE), so any
                // ordering that lets a chat-output land after chat-history-complete
                // pins the chat input disabled until the next live event. Keeping
                // this send in `.finally` AFTER the drain guarantees the final
                // flip is `isStreaming = false` whenever the live CLI has already
                // exited (no more live events coming).
                if (!drainSendFailed) {
                  try {
                    subWs.send(
                      JSON.stringify(
                        wsMessageContract.parse({
                          type: 'chat-history-complete',
                          payload: { questId: subQuestId },
                          timestamp: isoTimestampContract.parse(new Date().toISOString()),
                        }),
                      ),
                    );
                  } catch {
                    clientSubscriptions.delete(subWs);
                    clients.delete(subWs);
                  }
                }
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
                // Send current quest state to the requesting client BEFORE replay,
                // mirroring subscribe-quest. Keeps both flows consistent.
                replayWs.send(
                  JSON.stringify(
                    wsMessageContract.parse({
                      type: 'quest-modified',
                      payload: { questId: replayQuestId, quest },
                      timestamp: isoTimestampContract.parse(new Date().toISOString()),
                    }),
                  ),
                );
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
        const closedClient = ws as WsClient;
        clients.delete(closedClient);
        clientSubscriptions.delete(closedClient);
        replayInProgressByClient.delete(closedClient);
        bufferedDuringReplay.delete(closedClient);
        replayDeliveredWorkItems.delete(closedClient);
        // Drop any readonly-replay tracking for this client — the SessionViewWidget
        // is gone, so subsequent chat-output frames for those chatProcessIds have
        // nowhere to be delivered.
        for (const [pid, replayWs] of replayClientByChatProcessId) {
          if (replayWs === closedClient) replayClientByChatProcessId.delete(pid);
        }
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
        const payloadChatProcessId = parsedPayload.success
          ? parsedPayload.data.chatProcessId
          : undefined;
        const payloadWorkItemId = parsedPayload.success ? parsedPayload.data.workItemId : undefined;

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
          // Per-quest events fan out to subscribed clients whose subscription matches
          // the payload's questId, AND to any readonly-replay client tracked by
          // chatProcessId (SessionViewWidget — won't have a subscription). Track
          // already-delivered clients so a client somehow on both paths is not double-sent.
          const serializedQuestMsg = JSON.stringify(envelope);
          const delivered = new Set<WsClient>();

          if (payloadQuestId) {
            for (const [client, subs] of clientSubscriptions) {
              if (!subs.has(payloadQuestId)) continue;
              const replaying = replayInProgressByClient.get(client);
              if (replaying?.has(payloadQuestId) && type === 'chat-output') {
                // chat-output is the one per-quest event replay also emits, so we have to
                // suppress live chat-output during the replay window to prevent duplicates.
                // Replay-emitted frames carry chatProcessId starting with `quest-replay-`
                // and reach the client through the direct-send path below — those pass
                // through. LIVE chat-output (different chatProcessId) is buffered per
                // workItem and drained in the subscribe-quest .finally for workItems whose
                // replay raced an unwritten JSONL.
                const isReplayFrame =
                  typeof payloadChatProcessId === 'string' &&
                  payloadChatProcessId.startsWith('quest-replay-');
                if (!isReplayFrame) {
                  let questBuffer = bufferedDuringReplay.get(client);
                  if (!questBuffer) {
                    questBuffer = new Map<QuestId, Map<QuestWorkItemId | null, WsMessage[]>>();
                    bufferedDuringReplay.set(client, questBuffer);
                  }
                  let workItemBuffer = questBuffer.get(payloadQuestId);
                  if (!workItemBuffer) {
                    workItemBuffer = new Map<QuestWorkItemId | null, WsMessage[]>();
                    questBuffer.set(payloadQuestId, workItemBuffer);
                  }
                  const key: QuestWorkItemId | null = payloadWorkItemId ?? null;
                  const msgs = workItemBuffer.get(key) ?? [];
                  msgs.push(envelope);
                  workItemBuffer.set(key, msgs);
                }
                continue;
              }
              // Non-chat-output per-quest events (chat-complete, clarification-request,
              // chat-session-started, chat-history-complete, quest-modified, quest-created,
              // quest-session-linked) fall through to direct delivery even during a replay
              // window — replay never emits these, so there is no dupe risk and the client
              // needs them in real time. Dropping chat-complete during the replay window
              // would leave isStreaming pinned true on the web until the next live event.
              try {
                client.send(serializedQuestMsg);
                delivered.add(client);
              } catch {
                clientSubscriptions.delete(client);
                clients.delete(client);
              }
            }
          }

          // Readonly-replay direct-send. Routes orphan-session chat-output (no questId)
          // and chat-history-complete events back to the SessionViewWidget that asked
          // for them via `replay-history`. subscribe-quest's internal replay uses
          // chatProcessIds like `quest-replay-<questId>-<workItemId>-<sessionId>` which
          // are NEVER set in this map, so the per-quest path remains the only delivery
          // surface for those events.
          if (payloadChatProcessId) {
            const replayClient = replayClientByChatProcessId.get(payloadChatProcessId);
            if (replayClient && !delivered.has(replayClient)) {
              try {
                replayClient.send(serializedQuestMsg);
                // Track replay-emitted chat-output by (client, questId, workItemId)
                // so subscribe-quest .finally drains the live buffer ONLY for
                // workItems whose replay raced an unwritten JSONL. WorkItems with
                // missing JSONL never appear in this set, so their buffered live
                // frames are delivered (race recovery). WorkItems with successful
                // replays are added here, so their buffer is dropped (no dupes).
                if (type === 'chat-output' && payloadQuestId) {
                  let questDelivered = replayDeliveredWorkItems.get(replayClient);
                  if (!questDelivered) {
                    questDelivered = new Map<QuestId, Set<QuestWorkItemId | null>>();
                    replayDeliveredWorkItems.set(replayClient, questDelivered);
                  }
                  let workItemSet = questDelivered.get(payloadQuestId);
                  if (!workItemSet) {
                    workItemSet = new Set<QuestWorkItemId | null>();
                    questDelivered.set(payloadQuestId, workItemSet);
                  }
                  workItemSet.add(payloadWorkItemId ?? null);
                }
              } catch {
                clientSubscriptions.delete(replayClient);
                clients.delete(replayClient);
                replayClientByChatProcessId.delete(payloadChatProcessId);
              }
            }
            // Clean up the tracking entry once the readonly replay is over.
            if (type === 'chat-history-complete') {
              replayClientByChatProcessId.delete(payloadChatProcessId);
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
        const replaying = replayInProgressByClient.get(client);
        if (replaying?.has(flushQuestId)) continue;
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
