/**
 * PURPOSE: Initializes Hono HTTP server with REST endpoints and WebSocket relay for quest management and orchestration events
 *
 * USAGE:
 * StartServer();
 * // Starts HTTP server on port 3737 with project, quest, process, health, docs endpoints, and WebSocket event relay
 */

import { Hono } from 'hono';
import type { WSContext } from 'hono/ws';
import {
  questIdContract,
  processIdContract,
  projectIdContract,
  projectNameContract,
  projectPathContract,
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

import { orchestratorListProjectsAdapter } from '../adapters/orchestrator/list-projects/orchestrator-list-projects-adapter';
import { orchestratorAddProjectAdapter } from '../adapters/orchestrator/add-project/orchestrator-add-project-adapter';
import { orchestratorGetProjectAdapter } from '../adapters/orchestrator/get-project/orchestrator-get-project-adapter';
import { orchestratorUpdateProjectAdapter } from '../adapters/orchestrator/update-project/orchestrator-update-project-adapter';
import { orchestratorRemoveProjectAdapter } from '../adapters/orchestrator/remove-project/orchestrator-remove-project-adapter';
import { orchestratorBrowseDirectoriesAdapter } from '../adapters/orchestrator/browse-directories/orchestrator-browse-directories-adapter';
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

  // Project list
  app.get(apiRoutesStatics.projects.list, async (c) => {
    try {
      const projects = await orchestratorListProjectsAdapter();
      return c.json(projects);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to list projects';
      return c.json({ error: message }, httpStatusStatics.serverError.internal);
    }
  });

  // Project add
  app.post(apiRoutesStatics.projects.list, async (c) => {
    try {
      const body: unknown = await c.req.json();

      if (typeof body !== 'object' || body === null) {
        return c.json(
          { error: 'Request body must be a JSON object' },
          httpStatusStatics.clientError.badRequest,
        );
      }

      const rawName: unknown = Reflect.get(body, 'name');
      const rawPath: unknown = Reflect.get(body, 'path');

      if (typeof rawName !== 'string' || typeof rawPath !== 'string') {
        return c.json(
          { error: 'name and path are required strings' },
          httpStatusStatics.clientError.badRequest,
        );
      }

      const name = projectNameContract.parse(rawName);
      const path = projectPathContract.parse(rawPath);
      const result = await orchestratorAddProjectAdapter({ name, path });
      return c.json(result, httpStatusStatics.success.created);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to add project';
      return c.json({ error: message }, httpStatusStatics.serverError.internal);
    }
  });

  // Project get by ID
  app.get(apiRoutesStatics.projects.byId, async (c) => {
    try {
      const projectIdRaw = c.req.param('projectId');
      const projectId = projectIdContract.parse(projectIdRaw);
      const project = await orchestratorGetProjectAdapter({ projectId });
      return c.json(project);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to get project';
      return c.json({ error: message }, httpStatusStatics.serverError.internal);
    }
  });

  // Project update
  app.patch(apiRoutesStatics.projects.byId, async (c) => {
    try {
      const projectIdRaw = c.req.param('projectId');
      const projectId = projectIdContract.parse(projectIdRaw);
      const body: unknown = await c.req.json();

      if (typeof body !== 'object' || body === null) {
        return c.json(
          { error: 'Request body must be a JSON object' },
          httpStatusStatics.clientError.badRequest,
        );
      }

      const rawName: unknown = Reflect.get(body, 'name');
      const rawPath: unknown = Reflect.get(body, 'path');

      const project = await orchestratorUpdateProjectAdapter({
        projectId,
        ...(typeof rawName === 'string' && { name: projectNameContract.parse(rawName) }),
        ...(typeof rawPath === 'string' && { path: projectPathContract.parse(rawPath) }),
      });
      return c.json(project);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update project';
      return c.json({ error: message }, httpStatusStatics.serverError.internal);
    }
  });

  // Project remove
  app.delete(apiRoutesStatics.projects.byId, async (c) => {
    try {
      const projectIdRaw = c.req.param('projectId');
      const projectId = projectIdContract.parse(projectIdRaw);
      await orchestratorRemoveProjectAdapter({ projectId });
      return c.json({ success: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to remove project';
      return c.json({ error: message }, httpStatusStatics.serverError.internal);
    }
  });

  // Directory browse
  app.post(apiRoutesStatics.directories.browse, async (c) => {
    try {
      const body: unknown = await c.req.json();
      const rawPath: unknown =
        typeof body === 'object' && body !== null ? Reflect.get(body, 'path') : undefined;

      const entries = orchestratorBrowseDirectoriesAdapter(
        typeof rawPath === 'string' ? { path: projectPathContract.parse(rawPath) } : {},
      );
      return c.json(entries);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to browse directories';
      return c.json({ error: message }, httpStatusStatics.serverError.internal);
    }
  });

  // Quest list
  app.get(apiRoutesStatics.quests.list, async (c) => {
    try {
      const projectIdRaw = c.req.query('projectId');

      if (!projectIdRaw) {
        return c.json(
          { error: 'projectId query parameter is required' },
          httpStatusStatics.clientError.badRequest,
        );
      }

      const projectId = projectIdContract.parse(projectIdRaw);
      const quests = await orchestratorListQuestsAdapter({ projectId });
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
      const quest = await orchestratorGetQuestAdapter({
        questId,
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
      const projectIdRaw: unknown = Reflect.get(body, 'projectId');

      if (typeof title !== 'string' || typeof userRequest !== 'string') {
        return c.json(
          { error: 'title and userRequest are required strings' },
          httpStatusStatics.clientError.badRequest,
        );
      }

      if (typeof projectIdRaw !== 'string') {
        return c.json({ error: 'projectId is required' }, httpStatusStatics.clientError.badRequest);
      }

      const projectId = projectIdContract.parse(projectIdRaw);
      const result = await orchestratorAddQuestAdapter({ title, userRequest, projectId });
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

      const result = await orchestratorModifyQuestAdapter({
        questId,
        input: body as never,
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
      const result = await orchestratorVerifyQuestAdapter({ questId });
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
      const processId = await orchestratorStartQuestAdapter({ questId });
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
