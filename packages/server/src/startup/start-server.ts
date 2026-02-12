/**
 * PURPOSE: Initializes Hono HTTP server with REST endpoints and WebSocket relay for quest management and orchestration events
 *
 * USAGE:
 * StartServer();
 * // Starts HTTP server on port 3737 with quest, process, health, docs endpoints, and WebSocket event relay
 */

import { Hono } from 'hono';
import type { WSContext } from 'hono/ws';
import {
  filePathContract,
  questIdContract,
  processIdContract,
  orchestrationEventTypeContract,
  wsMessageContract,
} from '@dungeonmaster/shared/contracts';
import { architectureOverviewBroker } from '@dungeonmaster/shared/brokers';
import {
  architectureFolderDetailBroker,
  architectureSyntaxRulesBroker,
  architectureTestingPatternsBroker,
  mcpDiscoverBroker,
} from '@dungeonmaster/mcp/brokers';
import {
  isoTimestampContract,
  orchestrationEventsState,
  slotIndexContract,
} from '@dungeonmaster/orchestrator';
import type { SlotIndex } from '@dungeonmaster/orchestrator';

import { orchestratorListQuestsAdapter } from '../adapters/orchestrator/list-quests/orchestrator-list-quests-adapter';
import { orchestratorGetQuestAdapter } from '../adapters/orchestrator/get-quest/orchestrator-get-quest-adapter';
import { orchestratorAddQuestAdapter } from '../adapters/orchestrator/add-quest/orchestrator-add-quest-adapter';
import { orchestratorModifyQuestAdapter } from '../adapters/orchestrator/modify-quest/orchestrator-modify-quest-adapter';
import { orchestratorVerifyQuestAdapter } from '../adapters/orchestrator/verify-quest/orchestrator-verify-quest-adapter';
import { orchestratorStartQuestAdapter } from '../adapters/orchestrator/start-quest/orchestrator-start-quest-adapter';
import { orchestratorGetQuestStatusAdapter } from '../adapters/orchestrator/get-quest-status/orchestrator-get-quest-status-adapter';
import { honoServeAdapter } from '../adapters/hono/serve/hono-serve-adapter';
import { honoCreateNodeWebSocketAdapter } from '../adapters/hono/create-node-web-socket/hono-create-node-web-socket-adapter';
import { serverConfigStatics } from '../statics/server-config/server-config-statics';
import { apiRoutesStatics } from '../statics/api-routes/api-routes-statics';
import { httpStatusStatics } from '../statics/http-status/http-status-statics';
import { agentOutputLineContract } from '../contracts/agent-output-line/agent-output-line-contract';
import type { AgentOutputLine } from '../contracts/agent-output-line/agent-output-line-contract';
import { agentOutputBufferState } from '../state/agent-output-buffer/agent-output-buffer-state';
import { wsEventRelayBroadcastBroker } from '../brokers/ws-event-relay/broadcast/ws-event-relay-broadcast-broker';
import type { WsClient } from '../contracts/ws-client/ws-client-contract';

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
      },
      onClose: (_evt, ws: WSContext) => {
        clients.delete(ws);
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

  // Quest list
  app.get(apiRoutesStatics.quests.list, async (c) => {
    try {
      const startPath = filePathContract.parse(process.cwd());
      const quests = await orchestratorListQuestsAdapter({ startPath });
      return c.json(quests);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to list quests';
      return c.json({ error: message }, httpStatusStatics.serverError.internal);
    }
  });

  // Quest get by ID
  app.get(apiRoutesStatics.quests.byId, async (c) => {
    try {
      const questId = c.req.param('questId');
      const stage = c.req.query('stage');
      const startPath = filePathContract.parse(process.cwd());
      const quest = await orchestratorGetQuestAdapter({
        questId,
        startPath,
        ...(stage && { stage }),
      });
      return c.json(quest);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to get quest';
      return c.json({ error: message }, httpStatusStatics.serverError.internal);
    }
  });

  // Quest add
  app.post(apiRoutesStatics.quests.list, async (c) => {
    try {
      const body: unknown = await c.req.json();

      if (typeof body !== 'object' || body === null) {
        return c.json(
          { error: 'Request body must be a JSON object' },
          httpStatusStatics.clientError.badRequest,
        );
      }

      const title: unknown = Reflect.get(body, 'title');
      const userRequest: unknown = Reflect.get(body, 'userRequest');

      if (typeof title !== 'string' || typeof userRequest !== 'string') {
        return c.json(
          { error: 'title and userRequest are required strings' },
          httpStatusStatics.clientError.badRequest,
        );
      }

      const startPath = filePathContract.parse(process.cwd());
      const result = await orchestratorAddQuestAdapter({ title, userRequest, startPath });
      return c.json(result, httpStatusStatics.success.created);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to add quest';
      return c.json({ error: message }, httpStatusStatics.serverError.internal);
    }
  });

  // Quest modify
  app.patch(apiRoutesStatics.quests.byId, async (c) => {
    try {
      const questId = c.req.param('questId');
      const body: unknown = await c.req.json();

      if (typeof body !== 'object' || body === null) {
        return c.json(
          { error: 'Request body must be a JSON object' },
          httpStatusStatics.clientError.badRequest,
        );
      }

      const startPath = filePathContract.parse(process.cwd());
      const result = await orchestratorModifyQuestAdapter({
        questId,
        input: body as never,
        startPath,
      });
      return c.json(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to modify quest';
      return c.json({ error: message }, httpStatusStatics.serverError.internal);
    }
  });

  // Quest verify
  app.post(apiRoutesStatics.quests.verify, async (c) => {
    try {
      const questId = c.req.param('questId');
      const startPath = filePathContract.parse(process.cwd());
      const result = await orchestratorVerifyQuestAdapter({ questId, startPath });
      return c.json(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to verify quest';
      return c.json({ error: message }, httpStatusStatics.serverError.internal);
    }
  });

  // Quest start orchestration
  app.post(apiRoutesStatics.quests.start, async (c) => {
    try {
      const questIdRaw = c.req.param('questId');
      const questId = questIdContract.parse(questIdRaw);
      const startPath = filePathContract.parse(process.cwd());
      const processId = await orchestratorStartQuestAdapter({ questId, startPath });
      return c.json({ processId });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to start quest';
      return c.json({ error: message }, httpStatusStatics.serverError.internal);
    }
  });

  // Process status
  app.get(apiRoutesStatics.process.status, (c) => {
    try {
      const processIdRaw = c.req.param('processId');
      const processId = processIdContract.parse(processIdRaw);
      const status = orchestratorGetQuestStatusAdapter({ processId });
      return c.json(status);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to get process status';
      return c.json({ error: message }, httpStatusStatics.serverError.internal);
    }
  });

  // Process output - buffered agent output lines for late-joining clients
  app.get(apiRoutesStatics.process.output, (c) => {
    try {
      const processIdRaw = c.req.param('processId');
      const processId = processIdContract.parse(processIdRaw);
      const processBuffers = agentOutputBufferState.getProcessOutput({ processId });

      if (!processBuffers) {
        return c.json({ slots: {} });
      }

      const slots: Record<SlotIndex, AgentOutputLine[]> = {};
      for (const [slotIndex, lines] of processBuffers) {
        slots[slotIndex] = lines;
      }
      return c.json({ slots });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to get process output';
      return c.json({ error: message }, httpStatusStatics.serverError.internal);
    }
  });

  // Docs - architecture overview
  app.get(apiRoutesStatics.docs.architecture, (c) => {
    try {
      const result = architectureOverviewBroker();
      return c.json({ content: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to get architecture';
      return c.json({ error: message }, httpStatusStatics.serverError.internal);
    }
  });

  // Docs - folder detail
  app.get(apiRoutesStatics.docs.folderDetail, (c) => {
    try {
      const folderType = c.req.param('type');
      const result = architectureFolderDetailBroker({ folderType: folderType as never });
      return c.json({ content: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to get folder detail';
      return c.json({ error: message }, httpStatusStatics.serverError.internal);
    }
  });

  // Docs - syntax rules
  app.get(apiRoutesStatics.docs.syntaxRules, (c) => {
    try {
      const result = architectureSyntaxRulesBroker();
      return c.json({ content: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to get syntax rules';
      return c.json({ error: message }, httpStatusStatics.serverError.internal);
    }
  });

  // Docs - testing patterns
  app.get(apiRoutesStatics.docs.testingPatterns, (c) => {
    try {
      const result = architectureTestingPatternsBroker();
      return c.json({ content: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to get testing patterns';
      return c.json({ error: message }, httpStatusStatics.serverError.internal);
    }
  });

  // Discover
  app.post(apiRoutesStatics.discover.search, async (c) => {
    try {
      const body: unknown = await c.req.json();
      const result = await mcpDiscoverBroker({ input: body as never });
      return c.json(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to discover';
      return c.json({ error: message }, httpStatusStatics.serverError.internal);
    }
  });

  // Redirect root to web SPA dev server
  app.get('/', (c) => c.redirect('http://localhost:5173'));

  // Start the server and inject WebSocket support
  const server = honoServeAdapter({
    fetch: app.fetch,
    port: serverConfigStatics.network.port,
    hostname: serverConfigStatics.network.host,
    onListen: (info) => {
      process.stdout.write(
        `Server listening on http://${serverConfigStatics.network.host}:${info.port}\n`,
      );
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
};

if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
  StartServer();
}
