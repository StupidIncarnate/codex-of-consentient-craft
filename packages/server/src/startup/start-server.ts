/**
 * PURPOSE: Initializes Hono HTTP server with REST endpoints and WebSocket relay for quest management and orchestration events
 *
 * USAGE:
 * StartServer();
 * // Starts HTTP server on port 3737 with guild, quest, process, health, docs endpoints, and WebSocket event relay
 */

import { Hono } from 'hono';
import type { WSContext } from 'hono/ws';
import { spawn } from 'child_process';
import { createInterface } from 'readline';
import { homedir } from 'os';
import {
  questIdContract,
  processIdContract,
  guildIdContract,
  guildNameContract,
  guildPathContract,
  orchestrationEventTypeContract,
  wsMessageContract,
  sessionIdContract,
  absoluteFilePathContract,
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

import { orchestratorListGuildsAdapter } from '../adapters/orchestrator/list-guilds/orchestrator-list-guilds-adapter';
import { orchestratorAddGuildAdapter } from '../adapters/orchestrator/add-guild/orchestrator-add-guild-adapter';
import { orchestratorGetGuildAdapter } from '../adapters/orchestrator/get-guild/orchestrator-get-guild-adapter';
import { orchestratorUpdateGuildAdapter } from '../adapters/orchestrator/update-guild/orchestrator-update-guild-adapter';
import { orchestratorRemoveGuildAdapter } from '../adapters/orchestrator/remove-guild/orchestrator-remove-guild-adapter';
import { orchestratorBrowseDirectoriesAdapter } from '../adapters/orchestrator/browse-directories/orchestrator-browse-directories-adapter';
import { orchestratorListQuestsAdapter } from '../adapters/orchestrator/list-quests/orchestrator-list-quests-adapter';
import { orchestratorGetQuestAdapter } from '../adapters/orchestrator/get-quest/orchestrator-get-quest-adapter';
import { orchestratorAddQuestAdapter } from '../adapters/orchestrator/add-quest/orchestrator-add-quest-adapter';
import { orchestratorModifyQuestAdapter } from '../adapters/orchestrator/modify-quest/orchestrator-modify-quest-adapter';
import { orchestratorVerifyQuestAdapter } from '../adapters/orchestrator/verify-quest/orchestrator-verify-quest-adapter';
import { orchestratorStartQuestAdapter } from '../adapters/orchestrator/start-quest/orchestrator-start-quest-adapter';
import { orchestratorGetQuestStatusAdapter } from '../adapters/orchestrator/get-quest-status/orchestrator-get-quest-status-adapter';
import { environmentStatics } from '@dungeonmaster/shared/statics';
import { honoServeAdapter } from '../adapters/hono/serve/hono-serve-adapter';
import { honoCreateNodeWebSocketAdapter } from '../adapters/hono/create-node-web-socket/hono-create-node-web-socket-adapter';
import { apiRoutesStatics } from '../statics/api-routes/api-routes-statics';
import { httpStatusStatics } from '../statics/http-status/http-status-statics';
import { agentOutputLineContract } from '../contracts/agent-output-line/agent-output-line-contract';
import type { AgentOutputLine } from '../contracts/agent-output-line/agent-output-line-contract';
import { agentOutputBufferState } from '../state/agent-output-buffer/agent-output-buffer-state';
import { wsEventRelayBroadcastBroker } from '../brokers/ws-event-relay/broadcast/ws-event-relay-broadcast-broker';
import type { WsClient } from '../contracts/ws-client/ws-client-contract';
import { fsReadJsonlAdapter } from '../adapters/fs/read-jsonl/fs-read-jsonl-adapter';
import { claudeProjectPathEncoderTransformer } from '../transformers/claude-project-path-encoder/claude-project-path-encoder-transformer';

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

  // Guild list
  app.get(apiRoutesStatics.guilds.list, async (c) => {
    try {
      const guilds = await orchestratorListGuildsAdapter();
      return c.json(guilds);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to list guilds';
      return c.json({ error: message }, httpStatusStatics.serverError.internal);
    }
  });

  // Guild add
  app.post(apiRoutesStatics.guilds.list, async (c) => {
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

      const name = guildNameContract.parse(rawName);
      const path = guildPathContract.parse(rawPath);
      const result = await orchestratorAddGuildAdapter({ name, path });
      return c.json(result, httpStatusStatics.success.created);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to add guild';
      return c.json({ error: message }, httpStatusStatics.serverError.internal);
    }
  });

  // Guild get by ID
  app.get(apiRoutesStatics.guilds.byId, async (c) => {
    try {
      const guildIdRaw = c.req.param('guildId');
      const guildId = guildIdContract.parse(guildIdRaw);
      const guild = await orchestratorGetGuildAdapter({ guildId });
      return c.json(guild);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to get guild';
      return c.json({ error: message }, httpStatusStatics.serverError.internal);
    }
  });

  // Guild update
  app.patch(apiRoutesStatics.guilds.byId, async (c) => {
    try {
      const guildIdRaw = c.req.param('guildId');
      const guildId = guildIdContract.parse(guildIdRaw);
      const body: unknown = await c.req.json();

      if (typeof body !== 'object' || body === null) {
        return c.json(
          { error: 'Request body must be a JSON object' },
          httpStatusStatics.clientError.badRequest,
        );
      }

      const rawName: unknown = Reflect.get(body, 'name');
      const rawPath: unknown = Reflect.get(body, 'path');

      const guild = await orchestratorUpdateGuildAdapter({
        guildId,
        ...(typeof rawName === 'string' && { name: guildNameContract.parse(rawName) }),
        ...(typeof rawPath === 'string' && { path: guildPathContract.parse(rawPath) }),
      });
      return c.json(guild);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update guild';
      return c.json({ error: message }, httpStatusStatics.serverError.internal);
    }
  });

  // Guild remove
  app.delete(apiRoutesStatics.guilds.byId, async (c) => {
    try {
      const guildIdRaw = c.req.param('guildId');
      const guildId = guildIdContract.parse(guildIdRaw);
      await orchestratorRemoveGuildAdapter({ guildId });
      return c.json({ success: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to remove guild';
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
        typeof rawPath === 'string' ? { path: guildPathContract.parse(rawPath) } : {},
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
      const guildIdRaw = c.req.query('guildId');

      if (!guildIdRaw) {
        return c.json(
          { error: 'guildId query parameter is required' },
          httpStatusStatics.clientError.badRequest,
        );
      }

      const guildId = guildIdContract.parse(guildIdRaw);
      const quests = await orchestratorListQuestsAdapter({ guildId });
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
      const guildIdRaw: unknown = Reflect.get(body, 'guildId');

      if (typeof title !== 'string' || typeof userRequest !== 'string') {
        return c.json(
          { error: 'title and userRequest are required strings' },
          httpStatusStatics.clientError.badRequest,
        );
      }

      if (typeof guildIdRaw !== 'string') {
        return c.json({ error: 'guildId is required' }, httpStatusStatics.clientError.badRequest);
      }

      const guildId = guildIdContract.parse(guildIdRaw);
      const result = await orchestratorAddQuestAdapter({ title, userRequest, guildId });
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

  // Quest chat - spawn Claude CLI and stream output via WebSocket
  app.post(apiRoutesStatics.quests.chat, async (c) => {
    try {
      const questIdRaw = c.req.param('questId');
      questIdContract.parse(questIdRaw);
      const body: unknown = await c.req.json();

      if (typeof body !== 'object' || body === null) {
        return c.json(
          { error: 'Request body must be a JSON object' },
          httpStatusStatics.clientError.badRequest,
        );
      }

      const rawMessage: unknown = Reflect.get(body, 'message');
      const rawSessionId: unknown = Reflect.get(body, 'sessionId');

      if (typeof rawMessage !== 'string' || rawMessage.length === 0) {
        return c.json({ error: 'message is required' }, httpStatusStatics.clientError.badRequest);
      }

      const chatProcessId = crypto.randomUUID();

      const args =
        typeof rawSessionId === 'string' && rawSessionId.length > 0
          ? ['--resume', rawSessionId, '-p', rawMessage]
          : ['-p', rawMessage];

      args.push('--output-format', 'stream-json', '--verbose');

      const childProcess = spawn('claude', args, {
        stdio: ['inherit', 'pipe', 'inherit'],
      });

      const { stdout } = childProcess;

      const rl = createInterface({ input: stdout as NodeJS.ReadableStream });

      rl.on('line', (line) => {
        wsEventRelayBroadcastBroker({
          clients,
          message: wsMessageContract.parse({
            type: 'chat-output',
            payload: { chatProcessId, line },
            timestamp: isoTimestampContract.parse(new Date().toISOString()),
          }),
        });
      });

      childProcess.on('exit', (code) => {
        wsEventRelayBroadcastBroker({
          clients,
          message: wsMessageContract.parse({
            type: 'chat-complete',
            payload: { chatProcessId, exitCode: code ?? 1 },
            timestamp: isoTimestampContract.parse(new Date().toISOString()),
          }),
        });
      });

      return c.json({ chatProcessId });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to start chat';
      return c.json({ error: message }, httpStatusStatics.serverError.internal);
    }
  });

  // Quest chat history - read JSONL session file
  app.get(apiRoutesStatics.quests.chatHistory, async (c) => {
    try {
      const rawSessionId = c.req.query('sessionId');

      if (!rawSessionId) {
        return c.json(
          { error: 'sessionId query parameter is required' },
          httpStatusStatics.clientError.badRequest,
        );
      }

      const sessionId = sessionIdContract.parse(rawSessionId);

      const homeDir = absoluteFilePathContract.parse(homedir());
      const projectPath = absoluteFilePathContract.parse(process.cwd());
      const jsonlPath = claudeProjectPathEncoderTransformer({
        homeDir,
        projectPath,
        sessionId,
      });

      const entries = await fsReadJsonlAdapter({ filePath: jsonlPath });

      const filtered = entries.filter((entry: unknown) => {
        if (typeof entry !== 'object' || entry === null) {
          return false;
        }
        const type: unknown = Reflect.get(entry, 'type');
        return type === 'user' || type === 'assistant';
      });

      return c.json(filtered);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to read chat history';
      return c.json({ error: message }, httpStatusStatics.serverError.internal);
    }
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
};

if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
  StartServer();
}
