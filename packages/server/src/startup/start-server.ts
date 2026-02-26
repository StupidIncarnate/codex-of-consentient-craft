/**
 * PURPOSE: Initializes Hono HTTP server with REST endpoints and WebSocket relay for quest management and orchestration events
 *
 * USAGE:
 * StartServer();
 * // Starts HTTP server on port 3737 with guild, quest, process, health endpoints, and WebSocket event relay
 */

import { Hono } from 'hono';
import type { WSContext } from 'hono/ws';
import {
  guildIdContract,
  orchestrationEventTypeContract,
  processIdContract,
  questIdContract,
  sessionIdContract,
  wsMessageContract,
} from '@dungeonmaster/shared/contracts';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import {
  isoTimestampContract,
  orchestrationEventsState,
  slotIndexContract,
  StartOrchestrator,
} from '@dungeonmaster/orchestrator';

import { GuildListResponder } from '../responders/guild/list/guild-list-responder';
import { GuildAddResponder } from '../responders/guild/add/guild-add-responder';
import { GuildGetResponder } from '../responders/guild/get/guild-get-responder';
import { GuildUpdateResponder } from '../responders/guild/update/guild-update-responder';
import { GuildRemoveResponder } from '../responders/guild/remove/guild-remove-responder';
import { SessionNewResponder } from '../responders/session/new/session-new-responder';
import { DirectoryBrowseResponder } from '../responders/directory/browse/directory-browse-responder';
import { QuestListResponder } from '../responders/quest/list/quest-list-responder';
import { QuestGetResponder } from '../responders/quest/get/quest-get-responder';
import { QuestAddResponder } from '../responders/quest/add/quest-add-responder';
import { QuestModifyResponder } from '../responders/quest/modify/quest-modify-responder';
import { QuestVerifyResponder } from '../responders/quest/verify/quest-verify-responder';
import { QuestStartResponder } from '../responders/quest/start/quest-start-responder';
import { ProcessStatusResponder } from '../responders/process/status/process-status-responder';
import { ProcessOutputResponder } from '../responders/process/output/process-output-responder';
import { SessionListResponder } from '../responders/session/list/session-list-responder';
import { SessionChatResponder } from '../responders/session/chat/session-chat-responder';
import { SessionChatStopResponder } from '../responders/session/chat-stop/session-chat-stop-responder';
import { environmentStatics } from '@dungeonmaster/shared/statics';
import { honoServeAdapter } from '../adapters/hono/serve/hono-serve-adapter';
import { honoCreateNodeWebSocketAdapter } from '../adapters/hono/create-node-web-socket/hono-create-node-web-socket-adapter';
import { apiRoutesStatics } from '../statics/api-routes/api-routes-statics';
import { agentOutputLineContract } from '../contracts/agent-output-line/agent-output-line-contract';
import { agentOutputBufferState } from '../state/agent-output-buffer/agent-output-buffer-state';
import { orchestratorStopAllChatsAdapter } from '../adapters/orchestrator/stop-all-chats/orchestrator-stop-all-chats-adapter';
import { wsEventRelayBroadcastBroker } from '../brokers/ws-event-relay/broadcast/ws-event-relay-broadcast-broker';
import type { WsClient } from '../contracts/ws-client/ws-client-contract';
import { processDevLogAdapter } from '../adapters/process/dev-log/process-dev-log-adapter';

const FLUSH_INTERVAL_MS = 100;

export const StartServer = (): void => {
  const app = new Hono();

  const nodeWebSocket = honoCreateNodeWebSocketAdapter({ app });
  const { upgradeWebSocket } = nodeWebSocket;
  const clients = new Set<WsClient & WSContext>();

  // WebSocket upgrade route for real-time orchestration events
  app.get(
    '/ws',
    upgradeWebSocket(() => ({
      onOpen: (_evt, ws: WSContext) => {
        clients.add(ws);
        processDevLogAdapter({ message: 'WebSocket client connected' });
      },
      onMessage: (evt, _ws: WSContext) => {
        try {
          const raw: unknown = typeof evt.data === 'string' ? JSON.parse(evt.data) : undefined;

          if (typeof raw !== 'object' || raw === null) return;

          const type: unknown = Reflect.get(raw, 'type');

          if (type === 'replay-history') {
            const sessionId = sessionIdContract.parse(Reflect.get(raw, 'sessionId'));
            const guildId = guildIdContract.parse(Reflect.get(raw, 'guildId'));
            const chatProcessId = processIdContract.parse(Reflect.get(raw, 'chatProcessId'));

            StartOrchestrator.replayChatHistory({ sessionId, guildId, chatProcessId }).catch(() => {
              processDevLogAdapter({ message: 'replay-history failed' });
            });
          }

          if (type === 'quest-data-request') {
            const questId = questIdContract.parse(Reflect.get(raw, 'questId'));

            StartOrchestrator.loadQuest({ questId })
              .then((quest) => {
                const message = wsMessageContract.parse({
                  type: 'quest-modified',
                  payload: { questId, quest },
                  timestamp: isoTimestampContract.parse(new Date().toISOString()),
                });
                _ws.send(JSON.stringify(message));
              })
              .catch(() => {
                processDevLogAdapter({ message: `quest-data-request failed for ${questId}` });
              });
          }
        } catch {
          processDevLogAdapter({ message: 'WebSocket message parse error' });
        }
      },
      onClose: (_evt, ws: WSContext) => {
        clients.delete(ws);
        processDevLogAdapter({ message: 'WebSocket client disconnected' });
      },
    })),
  );

  // Health check
  app.get(apiRoutesStatics.health.check, (c) =>
    c.json({
      status: 'ok',
      timestamp: isoTimestampContract.parse(new Date().toISOString()),
    }),
  );

  // Guild list
  app.get(apiRoutesStatics.guilds.list, async (c) => {
    const result = await GuildListResponder();
    return c.json(result.data as object, result.status as ContentfulStatusCode);
  });

  // Guild add
  app.post(apiRoutesStatics.guilds.list, async (c) => {
    const result = await GuildAddResponder({ body: await c.req.json() });
    return c.json(result.data as object, result.status as ContentfulStatusCode);
  });

  // Guild get by ID
  app.get(apiRoutesStatics.guilds.byId, async (c) => {
    const result = await GuildGetResponder({ params: { guildId: c.req.param('guildId') } });
    return c.json(result.data as object, result.status as ContentfulStatusCode);
  });

  // Guild update
  app.patch(apiRoutesStatics.guilds.byId, async (c) => {
    const result = await GuildUpdateResponder({
      params: { guildId: c.req.param('guildId') },
      body: await c.req.json(),
    });
    return c.json(result.data as object, result.status as ContentfulStatusCode);
  });

  // Guild remove
  app.delete(apiRoutesStatics.guilds.byId, async (c) => {
    const result = await GuildRemoveResponder({ params: { guildId: c.req.param('guildId') } });
    return c.json(result.data as object, result.status as ContentfulStatusCode);
  });

  // Directory browse
  app.post(apiRoutesStatics.directories.browse, async (c) => {
    const body: unknown = await c.req.json();
    const result = DirectoryBrowseResponder({ body });
    return c.json(result.data as object, result.status as ContentfulStatusCode);
  });

  // Quest list
  app.get(apiRoutesStatics.quests.list, async (c) => {
    const result = await QuestListResponder({ query: { guildId: c.req.query('guildId') } });
    return c.json(result.data as object, result.status as ContentfulStatusCode);
  });

  // Quest get by ID
  app.get(apiRoutesStatics.quests.byId, async (c) => {
    const result = await QuestGetResponder({
      params: { questId: c.req.param('questId') },
      query: { stage: c.req.query('stage') },
    });
    return c.json(result.data as object, result.status as ContentfulStatusCode);
  });

  // Quest add (with session migration from guild)
  app.post(apiRoutesStatics.quests.list, async (c) => {
    const result = await QuestAddResponder({ body: await c.req.json() });
    return c.json(result.data as object, result.status as ContentfulStatusCode);
  });

  // Quest modify
  app.patch(apiRoutesStatics.quests.byId, async (c) => {
    const result = await QuestModifyResponder({
      params: { questId: c.req.param('questId') },
      body: await c.req.json(),
    });
    return c.json(result.data as object, result.status as ContentfulStatusCode);
  });

  // Quest verify
  app.post(apiRoutesStatics.quests.verify, async (c) => {
    const result = await QuestVerifyResponder({ params: { questId: c.req.param('questId') } });
    return c.json(result.data as object, result.status as ContentfulStatusCode);
  });

  // Quest start orchestration
  app.post(apiRoutesStatics.quests.start, async (c) => {
    const result = await QuestStartResponder({ params: { questId: c.req.param('questId') } });
    return c.json(result.data as object, result.status as ContentfulStatusCode);
  });

  // Process status
  app.get(apiRoutesStatics.process.status, (c) => {
    const result = ProcessStatusResponder({ params: { processId: c.req.param('processId') } });
    return c.json(result.data as object, result.status as ContentfulStatusCode);
  });

  // Process output - buffered agent output lines for late-joining clients
  app.get(apiRoutesStatics.process.output, (c) => {
    const result = ProcessOutputResponder({ params: { processId: c.req.param('processId') } });
    return c.json(result.data as object, result.status as ContentfulStatusCode);
  });

  // Session new (create new session)
  app.post(apiRoutesStatics.sessions.new, async (c) => {
    const result = await SessionNewResponder({
      body: await c.req.json(),
    });
    return c.json(result.data as object, result.status as ContentfulStatusCode);
  });

  // Session list
  app.get(apiRoutesStatics.sessions.list, async (c) => {
    const result = await SessionListResponder({
      params: { guildId: c.req.param('guildId') },
    });
    return c.json(result.data as object, result.status as ContentfulStatusCode);
  });

  // Session chat
  app.post(apiRoutesStatics.sessions.chat, async (c) => {
    const result = await SessionChatResponder({
      params: { sessionId: c.req.param('sessionId') },
      body: await c.req.json(),
    });
    return c.json(result.data as object, result.status as ContentfulStatusCode);
  });

  // Session chat stop
  app.post(apiRoutesStatics.sessions.chatStop, (c) => {
    const result = SessionChatStopResponder({
      params: { chatProcessId: c.req.param('chatProcessId') },
    });
    return c.json(result.data as object, result.status as ContentfulStatusCode);
  });

  // Redirect root to web SPA
  const serverPort = Number(process.env.DUNGEONMASTER_PORT) || environmentStatics.defaultPort;
  const serverHost = environmentStatics.hostname;
  app.get('/', (c) => c.redirect(`http://${serverHost}:${serverPort + 1}`));

  // Start the server and inject WebSocket support
  const server = honoServeAdapter({
    fetch: app.fetch,
    port: serverPort,
    hostname: serverHost,
    onListen: (info) => {
      process.stdout.write(`Server listening on http://${serverHost}:${info.port}\n`);
    },
  });
  nodeWebSocket.injectWebSocket(server);

  // Subscribe to non-agent-output events and broadcast immediately to WebSocket clients
  const eventTypes = orchestrationEventTypeContract.options;
  for (const type of eventTypes) {
    if (type === 'agent-output') continue;

    orchestrationEventsState.on({
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

  // Subscribe to agent-output events and buffer lines for batched sending
  orchestrationEventsState.on({
    type: 'agent-output',
    handler: ({ processId, payload }) => {
      const slotIndex = slotIndexContract.parse(Reflect.get(payload, 'slotIndex'));
      const rawLine = Reflect.get(payload, 'line');
      const line = agentOutputLineContract.parse(typeof rawLine === 'string' ? rawLine : '');

      agentOutputBufferState.addLine({ processId, slotIndex, line });
    },
  });

  // Flush batched agent-output lines to WS clients every 100ms
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

  // Kill all active chat processes on server shutdown
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

if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
  StartServer();
}
