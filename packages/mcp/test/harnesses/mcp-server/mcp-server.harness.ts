/**
 * PURPOSE: Spawns an MCP server subprocess and provides JSON-RPC request/response communication for integration tests
 *
 * USAGE:
 * const mcp = mcpServerHarness();
 * const client = await mcp.createClient();
 * const response = await client.sendRequest(JsonRpcRequestStub({ ... }));
 * await client.close();
 */
import type { Guild, Quest } from '@dungeonmaster/shared/contracts';
import { spawn } from '#gateway/node/child_process';
import { clearTimeout } from '#gateway/node/clearTimeout';
import { readFileSync } from '#gateway/node/fs';
import { ensureDir, writeFile } from '#gateway/node/fs__promises';
import { join } from '#gateway/node/path';
import { envSnapshot } from '#gateway/node/process';
import { setTimeout } from '#gateway/node/setTimeout';

import { installTestbedCreateBroker } from '@dungeonmaster/testing';

import {
  CallToolResultSchema,
  JSONRPCMessageSchema,
  ListToolsResultSchema,
} from '#gateway/npm/modelcontextprotocol__sdk__types';
import type {
  JSONRPCErrorResponse,
  JSONRPCRequest,
  JSONRPCResultResponse,
  TextContent,
} from '#gateway/npm/modelcontextprotocol__sdk__types';
import { JsonRpcRequestStub } from '#gateway/npm/modelcontextprotocol__sdk__types/json-rpc-request/json-rpc-request.stub';
import { mcpServerStatics } from '../../../src/statics/mcp-server/mcp-server-statics';

// A reply is a JSONRPCResultResponse (`result`) or a JSONRPCErrorResponse (`error`); the SDK types
// the two apart, while a test reads `response.result` and `response.error` off whichever arrived.
type JsonRpcReply = Pick<JSONRPCResultResponse, 'id'> &
  Partial<Pick<JSONRPCResultResponse, 'result'>> &
  Partial<Pick<JSONRPCErrorResponse, 'error'>>;
type JsonRpcRequest = JSONRPCRequest;
type RpcId = JSONRPCRequest['id'];

const JSON_INDENT_SPACES = 2;

interface McpClient {
  process: ReturnType<typeof spawn>;
  dungeonmasterHome: string;
  sendRequest: (request: JsonRpcRequest) => Promise<JsonRpcReply>;
  close: () => Promise<void>;
}

export const mcpServerHarness = (): {
  createClient: (params?: { baseName?: string }) => Promise<McpClient>;
  buildInitRequest: (params?: { id?: RpcId }) => JsonRpcRequest;
  buildToolListRequest: (params?: { id?: RpcId }) => JsonRpcRequest;
  readToolCallResult: (params: { response: JsonRpcReply }) => {
    content: TextContent[];
    isError?: boolean;
  };
  readToolListResult: (params: {
    response: JsonRpcReply;
  }) => ReturnType<typeof ListToolsResultSchema.parse>;
  seedQuest: (params: {
    dungeonmasterHome: string;
    guildId: string;
    questFolder: string;
    quest: unknown;
  }) => Promise<void>;
  readQuestFile: (params: {
    dungeonmasterHome: string;
    guildId: string;
    questFolder: string;
  }) => unknown;
} => {
  const buildInitRequest = ({ id = 1 }: { id?: RpcId } = {}): JsonRpcRequest =>
    JsonRpcRequestStub({
      id,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'test-client', version: '1.0.0' },
      },
    });

  const buildToolListRequest = ({ id = 2 }: { id?: RpcId } = {}): JsonRpcRequest =>
    JsonRpcRequestStub({
      id,
      method: 'tools/list',
      params: {},
    });

  const createClient = async ({
    baseName = 'mcp-harness',
  }: { baseName?: string } = {}): Promise<McpClient> => {
    const serverEntryPoint = join(__dirname, '../../../src/index.ts');

    const testbed = installTestbedCreateBroker({
      baseName,
    });

    // `--conditions=source` matches jest's `customExportConditions: ['source', ...]` (see
    // jest.config.base.js) so this spawned MCP server child resolves `@dungeonmaster/*` imports
    // to the same TypeScript source jest runs in-process, not whatever `dist/` was last built.
    const serverProcess = spawn('npx', ['tsx', '--conditions=source', serverEntryPoint], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: testbed.guildPath,
      env: { ...envSnapshot(), DUNGEONMASTER_HOME: testbed.guildPath },
    });

    const pendingResponses = new Map<RpcId, (response: JsonRpcReply) => void>();
    const pendingTimeouts = new Map<RpcId, NodeJS.Timeout>();
    const bufferState = { value: '' };

    const dataHandler = (chunk: Buffer): void => {
      bufferState.value += chunk.toString();

      const lines = bufferState.value.split('\n');
      const remaining = lines.pop() ?? '';
      bufferState.value = remaining;

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) {
          continue;
        }

        try {
          const parsed: unknown = JSON.parse(trimmedLine);
          const message = JSONRPCMessageSchema.parse(parsed);
          if (!('result' in message) && !('error' in message)) {
            continue;
          }
          if (message.id === undefined) {
            continue;
          }
          const response: JsonRpcReply = { ...message, id: message.id };
          const resolver = pendingResponses.get(response.id);
          if (resolver) {
            const timeoutId = pendingTimeouts.get(response.id);
            if (timeoutId) {
              clearTimeout(timeoutId);
              pendingTimeouts.delete(response.id);
            }

            resolver(response);
            pendingResponses.delete(response.id);
          }
        } catch {
          // Ignore parse errors
        }
      }
    };

    serverProcess.stdout.on('data', dataHandler);
    // Drain stderr so the pipe doesn't block when the child writes warnings.
    serverProcess.stderr.on('data', () => undefined);

    const sendRequestWithTimeout = async (
      request: JsonRpcRequest,
      timeoutMs: number,
    ): Promise<JsonRpcReply> =>
      new Promise((resolve, reject) => {
        pendingResponses.set(request.id, resolve);

        const requestJson = `${JSON.stringify(request)}\n`;
        serverProcess.stdin.write(requestJson);

        const timeoutId = setTimeout(() => {
          if (pendingResponses.has(request.id)) {
            pendingResponses.delete(request.id);
            pendingTimeouts.delete(request.id);
            reject(new Error(`Request ${String(request.id)} timed out`));
          }
        }, timeoutMs);

        pendingTimeouts.set(request.id, timeoutId);
      });

    // Deadline-budgeted readiness probe: send a throwaway initialize request
    // with a short per-attempt timeout, retrying until one succeeds or the
    // overall deadline is hit. Replaces a fixed startup sleep — under heavy
    // ward CPU contention (parallel jest+tsc+playwright) `npx tsx` cold-start
    // can easily exceed any fixed budget, while in isolation it warms up in
    // well under a second. Probing returns the moment the subprocess is
    // actually responsive on stdio.
    const probeReady = async (params: { deadline: number; attemptId: number }): Promise<void> => {
      if (Date.now() >= params.deadline) {
        throw new Error('MCP server did not become ready within readiness deadline');
      }
      const probeRequest = JsonRpcRequestStub({
        id: params.attemptId,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'mcp-harness-probe', version: '0.0.0' },
        },
      });
      const probeOutcome = await sendRequestWithTimeout(
        probeRequest,
        mcpServerStatics.timeouts.readinessProbeAttemptMs,
      ).then(
        () => 'ready' as const,
        () => 'pending' as const,
      );
      if (probeOutcome === 'ready') {
        return undefined;
      }
      await new Promise<void>((resolve) => {
        setTimeout(resolve, mcpServerStatics.timeouts.readinessProbeIntervalMs);
      });
      return probeReady({ deadline: params.deadline, attemptId: params.attemptId + 1 });
    };

    await probeReady({
      deadline: Date.now() + mcpServerStatics.timeouts.readinessDeadlineMs,
      attemptId: 900000,
    });

    return {
      process: serverProcess,
      dungeonmasterHome: testbed.guildPath,
      sendRequest: async (request: JsonRpcRequest): Promise<JsonRpcReply> =>
        sendRequestWithTimeout(request, mcpServerStatics.timeouts.requestMs),
      close: async (): Promise<void> =>
        new Promise((resolve) => {
          for (const timeoutId of pendingTimeouts.values()) {
            clearTimeout(timeoutId);
          }
          pendingTimeouts.clear();
          pendingResponses.clear();

          serverProcess.once('exit', () => {
            serverProcess.stdout.removeAllListeners();
            serverProcess.stderr.removeAllListeners();
            serverProcess.stdin.removeAllListeners();
            serverProcess.stdout.destroy();
            serverProcess.stderr.destroy();
            serverProcess.stdin.destroy();
            testbed.cleanup();
            resolve();
          });

          serverProcess.stdout.off('data', dataHandler);
          serverProcess.kill('SIGKILL');
        }),
    };
  };

  const seedQuest = async ({
    dungeonmasterHome,
    guildId,
    questFolder,
    quest,
  }: {
    dungeonmasterHome: string;
    guildId: string;
    questFolder: string;
    quest: unknown;
  }): Promise<void> => {
    const questDir = join(dungeonmasterHome, 'guilds', guildId, 'quests', questFolder);
    await ensureDir(questDir);
    await writeFile(join(questDir, 'quest.json'), JSON.stringify(quest, null, JSON_INDENT_SPACES));
  };

  // Reads the RAW persisted quest.json straight off disk, bypassing the get-quest MCP tool
  // entirely. That tool strips `comments` before an agent ever sees the response (by design —
  // see quest-strip-comments-transformer.ts), so it cannot be used to observe whether a comment
  // wrote, survived, or dropped after a modify-quest call. This is the only way an integration
  // test can inspect quest.comments post-write.
  const readQuestFile = ({
    dungeonmasterHome,
    guildId,
    questFolder,
  }: {
    dungeonmasterHome: string;
    guildId: string;
    questFolder: string;
  }): unknown => {
    const questDir = join(dungeonmasterHome, 'guilds', guildId, 'quests', questFolder);
    const raw = readFileSync(join(questDir, 'quest.json'));
    return JSON.parse(raw);
  };

  // Parses the reply's `result` through the SDK's own schema, so a test reads `content` and `tools`
  // off a value the SDK vouches for rather than off an unchecked cast. Tool results here are text.
  const readToolCallResult = ({
    response,
  }: {
    response: JsonRpcReply;
  }): { content: TextContent[]; isError?: boolean } => {
    const { content, isError } = CallToolResultSchema.parse(response.result);
    return {
      content: content.filter((item): item is TextContent => item.type === 'text'),
      ...(isError === undefined ? {} : { isError }),
    };
  };

  const readToolListResult = ({
    response,
  }: {
    response: JsonRpcReply;
  }): ReturnType<typeof ListToolsResultSchema.parse> =>
    ListToolsResultSchema.parse(response.result);

  return {
    createClient,
    buildInitRequest,
    buildToolListRequest,
    readToolCallResult,
    readToolListResult,
    seedQuest,
    readQuestFile,
  };
};
