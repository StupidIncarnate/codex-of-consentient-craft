/**
 * PURPOSE: Initializes Hono HTTP server with REST endpoints and WebSocket relay for quest management and orchestration events
 *
 * USAGE:
 * StartServer();
 * // Starts HTTP server on port 3737 with guild, quest, process, health endpoints, and WebSocket event relay
 */

import { Hono } from 'hono';
import type { WSContext } from 'hono/ws';
import { spawn } from 'child_process';
import { createInterface } from 'readline';
import { readdir, readFile, stat } from 'fs/promises';
import { join } from 'path';
import { osHomedirAdapter } from '@dungeonmaster/shared/adapters';
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
import type { SessionId } from '@dungeonmaster/shared/contracts';
import {
  isoTimestampContract,
  orchestrationEventsState,
  sessionIdExtractorTransformer,
  slotIndexContract,
  streamJsonLineContract,
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
import { attachAgentIdsToEntriesTransformer } from '../transformers/attach-agent-ids-to-entries/attach-agent-ids-to-entries-transformer';
import { apiRoutesStatics } from '../statics/api-routes/api-routes-statics';
import { httpStatusStatics } from '../statics/http-status/http-status-statics';
import { agentOutputLineContract } from '../contracts/agent-output-line/agent-output-line-contract';
import type { AgentOutputLine } from '../contracts/agent-output-line/agent-output-line-contract';
import { agentOutputBufferState } from '../state/agent-output-buffer/agent-output-buffer-state';
import { chatProcessState } from '../state/chat-process/chat-process-state';
import { wsEventRelayBroadcastBroker } from '../brokers/ws-event-relay/broadcast/ws-event-relay-broadcast-broker';
import type { WsClient } from '../contracts/ws-client/ws-client-contract';
import { fsReadJsonlAdapter } from '../adapters/fs/read-jsonl/fs-read-jsonl-adapter';
import { claudeProjectPathEncoderTransformer } from '../transformers/claude-project-path-encoder/claude-project-path-encoder-transformer';
import { stripJsonlSuffixTransformer } from '../transformers/strip-jsonl-suffix/strip-jsonl-suffix-transformer';
import { globFindAdapter } from '../adapters/glob/find/glob-find-adapter';
import { globPatternContract } from '../contracts/glob-pattern/glob-pattern-contract';
import { filePathContract } from '../contracts/file-path/file-path-contract';
import { processDevLogAdapter } from '../adapters/process/dev-log/process-dev-log-adapter';
import { streamLineSummaryTransformer } from '../transformers/stream-line-summary/stream-line-summary-transformer';
import { extractSessionFileSummaryTransformer } from '../transformers/extract-session-file-summary/extract-session-file-summary-transformer';
import { fileContentsContract } from '../contracts/file-contents/file-contents-contract';
import { mtimeMsContract } from '../contracts/mtime-ms/mtime-ms-contract';
import { sessionSummaryCacheState } from '../state/session-summary-cache/session-summary-cache-state';
import { hasSessionSummaryGuard } from '../guards/has-session-summary/has-session-summary-guard';

const FLUSH_INTERVAL_MS = 100;
const CLAUDE_CLI_COMMAND = process.env.CLAUDE_CLI_PATH ?? 'claude';

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

  // Session resolve - find which quest (if any) owns a session
  app.get(apiRoutesStatics.guilds.sessionResolve, (c) => {
    try {
      return c.json({ questId: null });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to resolve session';
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

  // Quest add (with session migration from guild)
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

  // Quest chat - spawn Claude CLI and stream output via WebSocket
  app.post(apiRoutesStatics.quests.chat, async (c) => {
    try {
      const questIdRaw = c.req.param('questId');
      const questId = questIdContract.parse(questIdRaw);
      const guilds = await orchestratorListGuildsAdapter();
      const guildQuestPairs = await Promise.all(
        guilds.map(async (guild) => ({
          guild,
          quests: await orchestratorListQuestsAdapter({ guildId: guild.id }),
        })),
      );
      const matchingGuild = guildQuestPairs.find(({ quests }) =>
        quests.some((q) => q.id === questId),
      );

      if (!matchingGuild) {
        return c.json(
          { error: 'Guild not found for quest' },
          httpStatusStatics.clientError.notFound,
        );
      }

      const questGuildPath = matchingGuild.guild.path;
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

      const chatProcessId = processIdContract.parse(crypto.randomUUID());
      const resumeSessionId =
        typeof rawSessionId === 'string' && rawSessionId.length > 0
          ? sessionIdContract.parse(rawSessionId)
          : undefined;

      processDevLogAdapter({
        message: `Chat started: questId=${questIdRaw}, messageLength=${String(rawMessage.length)}${resumeSessionId ? `, resuming=${resumeSessionId}` : ''}`,
      });

      const args = resumeSessionId
        ? ['--resume', resumeSessionId, '-p', rawMessage]
        : ['-p', rawMessage];

      args.push('--output-format', 'stream-json', '--verbose');

      const childProcess = spawn(CLAUDE_CLI_COMMAND, args, {
        cwd: questGuildPath,
        stdio: ['inherit', 'pipe', 'inherit'],
      });

      processDevLogAdapter({
        message: `Claude CLI spawned: processId=${chatProcessId}, cwd=${questGuildPath}, args=${JSON.stringify(args)}`,
      });

      chatProcessState.register({
        processId: chatProcessId,
        kill: () => {
          childProcess.kill();
        },
      });

      const { stdout } = childProcess;

      const rl = createInterface({ input: stdout as NodeJS.ReadableStream });

      let extractedSessionId: SessionId | null = null;

      rl.on('line', (line) => {
        try {
          const parsed: unknown = JSON.parse(line);

          if (typeof parsed === 'object' && parsed !== null) {
            const summary = streamLineSummaryTransformer({ parsed });
            processDevLogAdapter({
              message: `Chat stream: processId=${chatProcessId}, ${summary}`,
            });
          } else {
            processDevLogAdapter({
              message: `Chat stream: processId=${chatProcessId}, type=non-object`,
            });
          }
        } catch {
          processDevLogAdapter({
            message: `Chat stream: processId=${chatProcessId}, type=unparseable`,
          });
        }

        if (!extractedSessionId) {
          const lineParseResult = streamJsonLineContract.safeParse(line);

          if (lineParseResult.success) {
            const sid = sessionIdExtractorTransformer({ line: lineParseResult.data });

            if (sid) {
              extractedSessionId = sid;
              processDevLogAdapter({
                message: `Session ID extracted: processId=${chatProcessId}, sessionId=${sid}`,
              });
            }
          }
        }

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
        processDevLogAdapter({
          message: `Chat completed: processId=${chatProcessId}, exitCode=${String(code ?? 1)}`,
        });
        chatProcessState.remove({ processId: chatProcessId });

        const sessionIdToPersist = resumeSessionId ?? extractedSessionId;
        wsEventRelayBroadcastBroker({
          clients,
          message: wsMessageContract.parse({
            type: 'chat-complete',
            payload: {
              chatProcessId,
              exitCode: code ?? 1,
              ...(sessionIdToPersist && { sessionId: sessionIdToPersist }),
            },
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

  // Quest chat stop - kill a running Claude CLI chat process
  app.post(apiRoutesStatics.quests.chatStop, (c) => {
    try {
      const chatProcessIdRaw = c.req.param('chatProcessId');
      const chatProcessId = processIdContract.parse(chatProcessIdRaw);
      processDevLogAdapter({ message: `Chat stop requested: processId=${chatProcessId}` });
      const killed = chatProcessState.kill({ processId: chatProcessId });
      processDevLogAdapter({
        message: `Chat stop result: processId=${chatProcessId}, killed=${String(killed)}`,
      });

      if (!killed) {
        return c.json(
          { error: 'Process not found or already exited' },
          httpStatusStatics.clientError.notFound,
        );
      }

      return c.json({ stopped: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to stop chat';
      return c.json({ error: message }, httpStatusStatics.serverError.internal);
    }
  });

  // Quest chat history - read JSONL session file
  app.get(apiRoutesStatics.quests.chatHistory, async (c) => {
    try {
      const questIdRaw = c.req.param('questId');
      const questId = questIdContract.parse(questIdRaw);
      const guilds = await orchestratorListGuildsAdapter();
      const guildQuestPairs = await Promise.all(
        guilds.map(async (guild) => ({
          guild,
          quests: await orchestratorListQuestsAdapter({ guildId: guild.id }),
        })),
      );
      const matchingGuild = guildQuestPairs.find(({ quests }) =>
        quests.some((q) => q.id === questId),
      );

      if (!matchingGuild) {
        return c.json(
          { error: 'Guild not found for quest' },
          httpStatusStatics.clientError.notFound,
        );
      }

      const rawSessionId = c.req.query('sessionId');

      if (!rawSessionId) {
        return c.json(
          { error: 'sessionId query parameter is required' },
          httpStatusStatics.clientError.badRequest,
        );
      }

      const sessionId = sessionIdContract.parse(rawSessionId);

      const homeDir = osHomedirAdapter();
      const projectPath = absoluteFilePathContract.parse(matchingGuild.guild.path);
      const jsonlPath = claudeProjectPathEncoderTransformer({
        homeDir,
        projectPath,
        sessionId,
      });

      const entries = await fsReadJsonlAdapter({ filePath: jsonlPath });

      const subagentsDir = join(stripJsonlSuffixTransformer({ filePath: jsonlPath }), 'subagents');
      let subagentEntries: unknown[] = [];

      try {
        const files = await readdir(subagentsDir);
        const jsonlFiles = files.filter((f) => f.endsWith('.jsonl'));
        const subagentResults = await Promise.all(
          jsonlFiles.map(async (file) =>
            fsReadJsonlAdapter({
              filePath: absoluteFilePathContract.parse(join(subagentsDir, file)),
            }),
          ),
        );
        subagentEntries = subagentResults.flat();
      } catch {
        // subagents directory may not exist
      }

      for (const e of entries) {
        if (typeof e === 'object' && e !== null) {
          Reflect.set(e, 'source', 'session');
        }
      }
      for (const e of subagentEntries) {
        if (typeof e === 'object' && e !== null) {
          Reflect.set(e, 'source', 'subagent');
        }
      }

      attachAgentIdsToEntriesTransformer({ entries });

      const allEntries = [...entries, ...subagentEntries].sort((a, b) => {
        const tsA =
          typeof a === 'object' && a !== null && 'timestamp' in a
            ? String(Reflect.get(a, 'timestamp'))
            : '';
        const tsB =
          typeof b === 'object' && b !== null && 'timestamp' in b
            ? String(Reflect.get(b, 'timestamp'))
            : '';

        return tsA.localeCompare(tsB);
      });

      const filtered = allEntries.filter((entry: unknown) => {
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

  // Guild chat - spawn Claude CLI and stream output via WebSocket (guild-level)
  app.post(apiRoutesStatics.guilds.chat, async (c) => {
    try {
      const guildIdRaw = c.req.param('guildId');
      const guildId = guildIdContract.parse(guildIdRaw);
      const guild = await orchestratorGetGuildAdapter({ guildId });
      const guildPath = guild.path;
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

      const chatProcessId = processIdContract.parse(crypto.randomUUID());
      const resumeSessionId =
        typeof rawSessionId === 'string' && rawSessionId.length > 0
          ? sessionIdContract.parse(rawSessionId)
          : undefined;

      processDevLogAdapter({
        message: `Guild chat started: guildId=${guildIdRaw}, messageLength=${String(rawMessage.length)}${resumeSessionId ? `, resuming=${resumeSessionId}` : ''}`,
      });

      const args = resumeSessionId
        ? ['--resume', resumeSessionId, '-p', rawMessage]
        : ['-p', rawMessage];

      args.push('--output-format', 'stream-json', '--verbose');

      const childProcess = spawn(CLAUDE_CLI_COMMAND, args, {
        cwd: guildPath,
        stdio: ['inherit', 'pipe', 'inherit'],
      });

      processDevLogAdapter({
        message: `Claude CLI spawned (guild): processId=${chatProcessId}, cwd=${guildPath}, args=${JSON.stringify(args)}`,
      });

      chatProcessState.register({
        processId: chatProcessId,
        kill: () => {
          childProcess.kill();
        },
      });

      const { stdout } = childProcess;

      const rl = createInterface({ input: stdout as NodeJS.ReadableStream });

      let extractedSessionId: SessionId | null = null;

      rl.on('line', (line) => {
        try {
          const parsed: unknown = JSON.parse(line);

          if (typeof parsed === 'object' && parsed !== null) {
            const summary = streamLineSummaryTransformer({ parsed });
            processDevLogAdapter({
              message: `Guild chat stream: processId=${chatProcessId}, ${summary}`,
            });
          } else {
            processDevLogAdapter({
              message: `Guild chat stream: processId=${chatProcessId}, type=non-object`,
            });
          }
        } catch {
          processDevLogAdapter({
            message: `Guild chat stream: processId=${chatProcessId}, type=unparseable`,
          });
        }

        if (!extractedSessionId) {
          const lineParseResult = streamJsonLineContract.safeParse(line);

          if (lineParseResult.success) {
            const sid = sessionIdExtractorTransformer({ line: lineParseResult.data });

            if (sid) {
              extractedSessionId = sid;
              processDevLogAdapter({
                message: `Session ID extracted (guild): processId=${chatProcessId}, sessionId=${sid}`,
              });
            }
          }
        }

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
        processDevLogAdapter({
          message: `Guild chat completed: processId=${chatProcessId}, exitCode=${String(code ?? 1)}`,
        });
        chatProcessState.remove({ processId: chatProcessId });

        const sessionIdToPersist = resumeSessionId ?? extractedSessionId;
        wsEventRelayBroadcastBroker({
          clients,
          message: wsMessageContract.parse({
            type: 'chat-complete',
            payload: {
              chatProcessId,
              exitCode: code ?? 1,
              ...(sessionIdToPersist && { sessionId: sessionIdToPersist }),
            },
            timestamp: isoTimestampContract.parse(new Date().toISOString()),
          }),
        });
      });

      return c.json({ chatProcessId });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to start guild chat';
      return c.json({ error: message }, httpStatusStatics.serverError.internal);
    }
  });

  // Guild chat stop - kill a running Claude CLI guild chat process
  app.post(apiRoutesStatics.guilds.chatStop, (c) => {
    try {
      const chatProcessIdRaw = c.req.param('chatProcessId');
      const chatProcessId = processIdContract.parse(chatProcessIdRaw);
      processDevLogAdapter({ message: `Guild chat stop requested: processId=${chatProcessId}` });
      const killed = chatProcessState.kill({ processId: chatProcessId });
      processDevLogAdapter({
        message: `Guild chat stop result: processId=${chatProcessId}, killed=${String(killed)}`,
      });

      if (!killed) {
        return c.json(
          { error: 'Process not found or already exited' },
          httpStatusStatics.clientError.notFound,
        );
      }

      return c.json({ stopped: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to stop guild chat';
      return c.json({ error: message }, httpStatusStatics.serverError.internal);
    }
  });

  // Guild chat history - read JSONL session file
  app.get(apiRoutesStatics.guilds.chatHistory, async (c) => {
    try {
      const guildIdRaw = c.req.param('guildId');
      const guildId = guildIdContract.parse(guildIdRaw);
      const guild = await orchestratorGetGuildAdapter({ guildId });
      const rawSessionId = c.req.query('sessionId');

      if (!rawSessionId) {
        return c.json(
          { error: 'sessionId query parameter is required' },
          httpStatusStatics.clientError.badRequest,
        );
      }

      const sessionId = sessionIdContract.parse(rawSessionId);

      const homeDir = osHomedirAdapter();
      const projectPath = absoluteFilePathContract.parse(guild.path);
      const jsonlPath = claudeProjectPathEncoderTransformer({
        homeDir,
        projectPath,
        sessionId,
      });

      const entries = await fsReadJsonlAdapter({ filePath: jsonlPath });

      const subagentsDir = join(stripJsonlSuffixTransformer({ filePath: jsonlPath }), 'subagents');
      let subagentEntries: unknown[] = [];

      try {
        const files = await readdir(subagentsDir);
        const jsonlFiles = files.filter((f) => f.endsWith('.jsonl'));
        const subagentResults = await Promise.all(
          jsonlFiles.map(async (file) =>
            fsReadJsonlAdapter({
              filePath: absoluteFilePathContract.parse(join(subagentsDir, file)),
            }),
          ),
        );
        subagentEntries = subagentResults.flat();
      } catch {
        // subagents directory may not exist
      }

      for (const e of entries) {
        if (typeof e === 'object' && e !== null) {
          Reflect.set(e, 'source', 'session');
        }
      }
      for (const e of subagentEntries) {
        if (typeof e === 'object' && e !== null) {
          Reflect.set(e, 'source', 'subagent');
        }
      }

      attachAgentIdsToEntriesTransformer({ entries });

      const allEntries = [...entries, ...subagentEntries].sort((a, b) => {
        const tsA =
          typeof a === 'object' && a !== null && 'timestamp' in a
            ? String(Reflect.get(a, 'timestamp'))
            : '';
        const tsB =
          typeof b === 'object' && b !== null && 'timestamp' in b
            ? String(Reflect.get(b, 'timestamp'))
            : '';

        return tsA.localeCompare(tsB);
      });

      const filtered = allEntries.filter((entry: unknown) => {
        if (typeof entry !== 'object' || entry === null) {
          return false;
        }
        const type: unknown = Reflect.get(entry, 'type');
        return type === 'user' || type === 'assistant';
      });

      return c.json(filtered);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to read guild chat history';
      return c.json({ error: message }, httpStatusStatics.serverError.internal);
    }
  });

  // Session list - disk is source of truth
  app.get(apiRoutesStatics.sessions.list, async (c) => {
    try {
      const guildIdRaw = c.req.param('guildId');
      const guildId = guildIdContract.parse(guildIdRaw);
      const guild = await orchestratorGetGuildAdapter({ guildId });

      const homeDir = osHomedirAdapter();
      const guildPath = absoluteFilePathContract.parse(guild.path);
      const dummySessionId = sessionIdContract.parse('_probe');
      const probePath = claudeProjectPathEncoderTransformer({
        homeDir,
        projectPath: guildPath,
        sessionId: dummySessionId,
      });
      const claudeProjectDir = filePathContract.parse(
        String(probePath).slice(0, String(probePath).lastIndexOf('/')),
      );

      const jsonlFiles = await globFindAdapter({
        pattern: globPatternContract.parse('*.jsonl'),
        cwd: claudeProjectDir,
      });

      const diskResults = await Promise.all(
        jsonlFiles.map(async (filePath) => {
          const fileName = String(filePath).split('/').pop() ?? '';
          const diskSessionId = sessionIdContract.parse(fileName.replace('.jsonl', ''));

          try {
            const stats = await stat(String(filePath));
            const startedAt = isoTimestampContract.parse(stats.birthtime.toISOString());

            const mtimeMs = mtimeMsContract.parse(stats.mtimeMs);
            const cached = sessionSummaryCacheState.get({ sessionId: diskSessionId, mtimeMs });
            const diskSummary: ReturnType<typeof extractSessionFileSummaryTransformer> =
              await (async (): Promise<ReturnType<typeof extractSessionFileSummaryTransformer>> => {
                if (cached.hit) {
                  return cached.summary;
                }

                const rawContent = await readFile(String(filePath), 'utf8').catch(() => '');
                const summary = rawContent
                  ? extractSessionFileSummaryTransformer({
                      fileContent: fileContentsContract.parse(rawContent),
                    })
                  : undefined;
                sessionSummaryCacheState.set({
                  sessionId: diskSessionId,
                  mtimeMs,
                  summary,
                });
                return summary;
              })();

            return {
              sessionId: diskSessionId,
              startedAt,
              ...(diskSummary ? { summary: diskSummary } : {}),
            };
          } catch {
            return null;
          }
        }),
      );

      const filteredSessions = diskResults
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
        .filter((entry) => hasSessionSummaryGuard({ session: entry }));

      const quests = await orchestratorListQuestsAdapter({ guildId });
      const sessionToQuest = new Map(
        quests
          .filter((q) => q.activeSessionId !== undefined)
          .map((q) => [String(q.activeSessionId), q] as const),
      );

      const allSessions = filteredSessions.map((entry) => {
        const quest = sessionToQuest.get(String(entry.sessionId));
        if (!quest) {
          return entry;
        }
        return {
          ...entry,
          questId: quest.id,
          questTitle: quest.title,
          questStatus: quest.status,
        };
      });

      allSessions.sort((a, b) => b.startedAt.localeCompare(a.startedAt));

      return c.json(allSessions);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to list sessions';
      return c.json({ error: message }, httpStatusStatics.serverError.internal);
    }
  });

  // Session chat - spawn Claude CLI for a session (resolves owner automatically)
  app.post(apiRoutesStatics.sessions.chat, async (c) => {
    try {
      const sessionIdRaw = c.req.param('sessionId');
      const sessionId = sessionIdContract.parse(sessionIdRaw);
      const body: unknown = await c.req.json();

      if (typeof body !== 'object' || body === null) {
        return c.json(
          { error: 'Request body must be a JSON object' },
          httpStatusStatics.clientError.badRequest,
        );
      }

      const rawMessage: unknown = Reflect.get(body, 'message');
      const rawGuildId: unknown = Reflect.get(body, 'guildId');

      if (typeof rawMessage !== 'string' || rawMessage.length === 0) {
        return c.json({ error: 'message is required' }, httpStatusStatics.clientError.badRequest);
      }

      if (typeof rawGuildId !== 'string') {
        return c.json({ error: 'guildId is required' }, httpStatusStatics.clientError.badRequest);
      }

      const guildId = guildIdContract.parse(rawGuildId);

      const guild = await orchestratorGetGuildAdapter({ guildId });
      const workingDir = guild.path;

      const chatProcessId = processIdContract.parse(crypto.randomUUID());

      processDevLogAdapter({
        message: `Session chat started: sessionId=${sessionIdRaw}, guildId=${rawGuildId}, messageLength=${String(rawMessage.length)}`,
      });

      const args = ['--resume', sessionId, '-p', rawMessage];
      args.push('--output-format', 'stream-json', '--verbose');

      const childProcess = spawn(CLAUDE_CLI_COMMAND, args, {
        cwd: workingDir,
        stdio: ['inherit', 'pipe', 'inherit'],
      });

      processDevLogAdapter({
        message: `Claude CLI spawned (session): processId=${chatProcessId}, cwd=${workingDir}, args=${JSON.stringify(args)}`,
      });

      chatProcessState.register({
        processId: chatProcessId,
        kill: () => {
          childProcess.kill();
        },
      });

      const { stdout } = childProcess;

      const rl = createInterface({ input: stdout as NodeJS.ReadableStream });

      rl.on('line', (line) => {
        try {
          const parsed: unknown = JSON.parse(line);

          if (typeof parsed === 'object' && parsed !== null) {
            const summary = streamLineSummaryTransformer({ parsed });
            processDevLogAdapter({
              message: `Session chat stream: processId=${chatProcessId}, ${summary}`,
            });
          } else {
            processDevLogAdapter({
              message: `Session chat stream: processId=${chatProcessId}, type=non-object`,
            });
          }
        } catch {
          processDevLogAdapter({
            message: `Session chat stream: processId=${chatProcessId}, type=unparseable`,
          });
        }

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
        processDevLogAdapter({
          message: `Session chat completed: processId=${chatProcessId}, exitCode=${String(code ?? 1)}`,
        });
        chatProcessState.remove({ processId: chatProcessId });

        wsEventRelayBroadcastBroker({
          clients,
          message: wsMessageContract.parse({
            type: 'chat-complete',
            payload: {
              chatProcessId,
              exitCode: code ?? 1,
              sessionId,
            },
            timestamp: isoTimestampContract.parse(new Date().toISOString()),
          }),
        });
      });

      return c.json({ chatProcessId });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to start session chat';
      return c.json({ error: message }, httpStatusStatics.serverError.internal);
    }
  });

  // Session chat stop - kill a running Claude CLI session chat process
  app.post(apiRoutesStatics.sessions.chatStop, (c) => {
    try {
      const chatProcessIdRaw = c.req.param('chatProcessId');
      const chatProcessId = processIdContract.parse(chatProcessIdRaw);
      processDevLogAdapter({ message: `Session chat stop requested: processId=${chatProcessId}` });
      const killed = chatProcessState.kill({ processId: chatProcessId });
      processDevLogAdapter({
        message: `Session chat stop result: processId=${chatProcessId}, killed=${String(killed)}`,
      });

      if (!killed) {
        return c.json(
          { error: 'Process not found or already exited' },
          httpStatusStatics.clientError.notFound,
        );
      }

      return c.json({ stopped: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to stop session chat';
      return c.json({ error: message }, httpStatusStatics.serverError.internal);
    }
  });

  // Session chat history - read JSONL session file (resolves owner automatically)
  app.get(apiRoutesStatics.sessions.chatHistory, async (c) => {
    try {
      const sessionIdRaw = c.req.param('sessionId');
      const sessionId = sessionIdContract.parse(sessionIdRaw);
      const rawGuildId = c.req.query('guildId');

      if (!rawGuildId) {
        return c.json(
          { error: 'guildId query parameter is required' },
          httpStatusStatics.clientError.badRequest,
        );
      }

      const guildId = guildIdContract.parse(rawGuildId);
      const guild = await orchestratorGetGuildAdapter({ guildId });
      const projectPath = absoluteFilePathContract.parse(guild.path);

      const homeDir = osHomedirAdapter();
      const jsonlPath = claudeProjectPathEncoderTransformer({
        homeDir,
        projectPath,
        sessionId,
      });

      const entries = await fsReadJsonlAdapter({ filePath: jsonlPath });

      const subagentsDir = join(stripJsonlSuffixTransformer({ filePath: jsonlPath }), 'subagents');
      let subagentEntries: unknown[] = [];

      try {
        const files = await readdir(subagentsDir);
        const jsonlFiles = files.filter((f) => f.endsWith('.jsonl'));
        const subagentResults = await Promise.all(
          jsonlFiles.map(async (file) =>
            fsReadJsonlAdapter({
              filePath: absoluteFilePathContract.parse(join(subagentsDir, file)),
            }),
          ),
        );
        subagentEntries = subagentResults.flat();
      } catch {
        // subagents directory may not exist
      }

      for (const e of entries) {
        if (typeof e === 'object' && e !== null) {
          Reflect.set(e, 'source', 'session');
        }
      }
      for (const e of subagentEntries) {
        if (typeof e === 'object' && e !== null) {
          Reflect.set(e, 'source', 'subagent');
        }
      }

      attachAgentIdsToEntriesTransformer({ entries });

      const allEntries = [...entries, ...subagentEntries].sort((a, b) => {
        const tsA =
          typeof a === 'object' && a !== null && 'timestamp' in a
            ? String(Reflect.get(a, 'timestamp'))
            : '';
        const tsB =
          typeof b === 'object' && b !== null && 'timestamp' in b
            ? String(Reflect.get(b, 'timestamp'))
            : '';

        return tsA.localeCompare(tsB);
      });

      const filtered = allEntries.filter((entry: unknown) => {
        if (typeof entry !== 'object' || entry === null) {
          return false;
        }
        const type: unknown = Reflect.get(entry, 'type');
        return type === 'user' || type === 'assistant';
      });

      return c.json(filtered);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to read session chat history';
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

  // Kill all active chat processes on server shutdown
  process.on('SIGTERM', () => {
    processDevLogAdapter({ message: 'Shutting down: killing all chat processes (SIGTERM)' });
    chatProcessState.killAll();
    process.exit(0);
  });
  process.on('SIGINT', () => {
    processDevLogAdapter({ message: 'Shutting down: killing all chat processes (SIGINT)' });
    chatProcessState.killAll();
    process.exit(0);
  });
};

if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
  StartServer();
}
