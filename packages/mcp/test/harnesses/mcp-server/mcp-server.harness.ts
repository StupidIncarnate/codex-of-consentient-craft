/**
 * PURPOSE: Spawns an MCP server subprocess and provides JSON-RPC request/response communication for integration tests
 *
 * USAGE:
 * const mcp = mcpServerHarness();
 * const client = await mcp.createClient();
 * const response = await client.sendRequest(JsonRpcRequestStub({ ... }));
 * await client.close();
 */
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

import type { GuildPath } from '@dungeonmaster/shared/contracts';
import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';

import { JsonRpcRequestStub } from '../../../src/contracts/json-rpc-request/json-rpc-request.stub';
import { JsonRpcResponseStub } from '../../../src/contracts/json-rpc-response/json-rpc-response.stub';
import { RpcIdStub } from '../../../src/contracts/rpc-id/rpc-id.stub';
import { RpcMethodStub } from '../../../src/contracts/rpc-method/rpc-method.stub';
import { BufferStateStub } from '../../../src/contracts/buffer-state/buffer-state.stub';
import { mcpServerStatics } from '../../../src/statics/mcp-server/mcp-server-statics';

type JsonRpcResponse = ReturnType<typeof JsonRpcResponseStub>;
type JsonRpcRequest = ReturnType<typeof JsonRpcRequestStub>;
type RpcId = ReturnType<typeof RpcIdStub>;

const JSON_INDENT_SPACES = 2;

interface McpClient {
  process: ReturnType<typeof spawn>;
  dungeonmasterHome: GuildPath;
  sendRequest: (request: JsonRpcRequest) => Promise<JsonRpcResponse>;
  close: () => Promise<void>;
}

export const mcpServerHarness = (): {
  createClient: (params?: { baseName?: ReturnType<typeof BaseNameStub> }) => Promise<McpClient>;
  buildInitRequest: (params?: { id?: ReturnType<typeof RpcIdStub> }) => JsonRpcRequest;
  buildToolListRequest: (params?: { id?: ReturnType<typeof RpcIdStub> }) => JsonRpcRequest;
  seedQuest: (params: {
    dungeonmasterHome: GuildPath;
    guildId: string;
    questFolder: string;
    quest: unknown;
  }) => void;
} => {
  const buildInitRequest = ({
    id = RpcIdStub({ value: 1 }),
  }: { id?: ReturnType<typeof RpcIdStub> } = {}): JsonRpcRequest =>
    JsonRpcRequestStub({
      id,
      method: RpcMethodStub({ value: 'initialize' }),
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'test-client', version: '1.0.0' },
      },
    });

  const buildToolListRequest = ({
    id = RpcIdStub({ value: 2 }),
  }: { id?: ReturnType<typeof RpcIdStub> } = {}): JsonRpcRequest =>
    JsonRpcRequestStub({
      id,
      method: RpcMethodStub({ value: 'tools/list' }),
      params: {},
    });

  const createClient = async ({
    baseName = BaseNameStub({ value: 'mcp-harness' }),
  }: { baseName?: ReturnType<typeof BaseNameStub> } = {}): Promise<McpClient> => {
    const serverEntryPoint = path.join(__dirname, '../../../src/index.ts');

    const testbed = installTestbedCreateBroker({
      baseName,
    });

    const serverProcess = spawn('npx', ['tsx', serverEntryPoint], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: testbed.guildPath,
      env: { ...process.env, DUNGEONMASTER_HOME: testbed.guildPath },
    });

    const pendingResponses = new Map<RpcId, (response: JsonRpcResponse) => void>();
    const pendingTimeouts = new Map<RpcId, NodeJS.Timeout>();
    const bufferState = BufferStateStub();

    const dataHandler = (chunk: Buffer): void => {
      bufferState.value = (bufferState.value + chunk.toString()) as typeof bufferState.value;

      const lines = bufferState.value.split('\n');
      const remaining = lines.pop() ?? '';
      bufferState.value = remaining as typeof bufferState.value;

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) {
          continue;
        }

        try {
          const parsed: unknown = JSON.parse(trimmedLine);
          const response = JsonRpcResponseStub(parsed as never);
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

    await new Promise((resolve) => {
      setTimeout(resolve, mcpServerStatics.timeouts.startupMs);
    });

    return {
      process: serverProcess,
      dungeonmasterHome: testbed.guildPath,
      sendRequest: async (request: JsonRpcRequest): Promise<JsonRpcResponse> =>
        new Promise((resolve, reject) => {
          pendingResponses.set(request.id, resolve);

          const requestJson = `${JSON.stringify(request)}\n`;
          serverProcess.stdin.write(requestJson);

          const timeoutId = setTimeout(() => {
            if (pendingResponses.has(request.id)) {
              pendingResponses.delete(request.id);
              pendingTimeouts.delete(request.id);
              reject(new Error(`Request ${request.id} timed out`));
            }
          }, mcpServerStatics.timeouts.requestMs);

          pendingTimeouts.set(request.id, timeoutId);
        }),
      close: async (): Promise<void> =>
        new Promise((resolve) => {
          for (const timeoutId of pendingTimeouts.values()) {
            clearTimeout(timeoutId);
          }
          pendingTimeouts.clear();
          pendingResponses.clear();

          serverProcess.once('close', () => {
            serverProcess.stdout.removeAllListeners();
            serverProcess.stderr.removeAllListeners();
            serverProcess.stdin.removeAllListeners();
            testbed.cleanup();
            resolve();
          });

          serverProcess.stdout.off('data', dataHandler);
          serverProcess.kill();
        }),
    };
  };

  const seedQuest = ({
    dungeonmasterHome,
    guildId,
    questFolder,
    quest,
  }: {
    dungeonmasterHome: GuildPath;
    guildId: string;
    questFolder: string;
    quest: unknown;
  }): void => {
    const questDir = path.join(dungeonmasterHome, 'guilds', guildId, 'quests', questFolder);
    fs.mkdirSync(questDir, { recursive: true });
    fs.writeFileSync(
      path.join(questDir, 'quest.json'),
      JSON.stringify(quest, null, JSON_INDENT_SPACES),
    );
  };

  return {
    createClient,
    buildInitRequest,
    buildToolListRequest,
    seedQuest,
  };
};
