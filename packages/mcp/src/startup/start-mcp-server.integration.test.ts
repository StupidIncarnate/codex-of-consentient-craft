/**
 * Integration test for StartMcpServer - tests actual function via subprocess
 * No mocks - spawns real server and communicates via stdio
 */

import { spawn } from 'child_process';
import * as path from 'path';
import { JsonRpcRequestStub } from '../contracts/json-rpc-request/json-rpc-request.stub';
import { JsonRpcResponseStub } from '../contracts/json-rpc-response/json-rpc-response.stub';
import { RpcIdStub } from '../contracts/rpc-id/rpc-id.stub';
import { RpcMethodStub } from '../contracts/rpc-method/rpc-method.stub';
import { ToolListResultStub } from '../contracts/tool-list-result/tool-list-result.stub';
import { ToolCallResultStub } from '../contracts/tool-call-result/tool-call-result.stub';
import { DiscoverTreeResultStub } from '../contracts/discover-tree-result/discover-tree-result.stub';
import { mcpServerStatics } from '../statics/mcp-server/mcp-server-statics';
import type { McpServerClientStub } from '../contracts/mcp-server-client/mcp-server-client.stub';
import { BufferStateStub } from '../contracts/buffer-state/buffer-state.stub';

type JsonRpcResponse = ReturnType<typeof JsonRpcResponseStub>;
type JsonRpcRequest = ReturnType<typeof JsonRpcRequestStub>;
type RpcId = ReturnType<typeof RpcIdStub>;
type McpServerClient = ReturnType<typeof McpServerClientStub>;

const createMcpClient = async (): Promise<McpServerClient> => {
  const serverEntryPoint = path.join(__dirname, '../index.ts');

  const serverProcess = spawn('npx', ['tsx', serverEntryPoint], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: path.join(__dirname, '../..'),
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
          resolve();
        });

        serverProcess.stdout.off('data', dataHandler);

        serverProcess.kill();
      }),
  };
};

describe('StartMcpServer', () => {
  describe('initialization', () => {
    it('VALID: Server starts and responds to initialize request', async () => {
      const client = await createMcpClient();

      const request = JsonRpcRequestStub({
        id: RpcIdStub({ value: 1 }),
        method: RpcMethodStub({ value: 'initialize' }),
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: {
            name: 'test-client',
            version: '1.0.0',
          },
        },
      });

      const response = await client.sendRequest(request);

      await client.close();

      expect(response.error).toBeUndefined();
      expect(response.result).toBeDefined();
    });
  });

  describe('tools/list', () => {
    it('VALID: Returns at least 5 tools including all expected tools', async () => {
      const client = await createMcpClient();

      const request = JsonRpcRequestStub({
        id: RpcIdStub({ value: 2 }),
        method: RpcMethodStub({ value: 'tools/list' }),
        params: {},
      });

      const response = await client.sendRequest(request);

      expect(response.error).toBeUndefined();

      const result = ToolListResultStub(response.result as never);

      await client.close();

      expect(result.tools.length).toBeGreaterThanOrEqual(5);

      const discoverTool = result.tools.find((tool) => tool.name === 'discover');
      const architectureTool = result.tools.find((tool) => tool.name === 'get-architecture');

      expect(discoverTool).toBeDefined();
      expect(architectureTool).toBeDefined();
    });

    it('VALID: All tool inputSchemas have type: "object" at root (required by Claude Code)', async () => {
      const client = await createMcpClient();

      const request = JsonRpcRequestStub({
        id: RpcIdStub({ value: 100 }),
        method: RpcMethodStub({ value: 'tools/list' }),
        params: {},
      });

      const response = await client.sendRequest(request);

      expect(response.error).toBeUndefined();

      const result = ToolListResultStub(response.result as never);

      await client.close();

      const toolsWithBadSchema = result.tools.filter((tool) => tool.inputSchema.type !== 'object');

      expect(toolsWithBadSchema).toStrictEqual([]);
    });
  });

  describe('tools/call with get-architecture', () => {
    it('VALID: Returns architecture overview markdown', async () => {
      const client = await createMcpClient();

      const request = JsonRpcRequestStub({
        id: RpcIdStub({ value: 3 }),
        method: RpcMethodStub({ value: 'tools/call' }),
        params: {
          name: 'get-architecture',
          arguments: {},
        },
      });

      const response = await client.sendRequest(request);

      await client.close();

      expect(response.error).toBeUndefined();

      const result = ToolCallResultStub(response.result as never);

      expect(result.content[0]?.type).toBe('text');
      expect(result.content[0]?.text).toMatch(/^.*# Architecture Overview.*$/su);
    });
  });

  describe('tools/call with get-testing-patterns', () => {
    it('VALID: Returns testing patterns markdown', async () => {
      const client = await createMcpClient();

      const request = JsonRpcRequestStub({
        id: RpcIdStub({ value: 13 }),
        method: RpcMethodStub({ value: 'tools/call' }),
        params: {
          name: 'get-testing-patterns',
          arguments: {},
        },
      });

      const response = await client.sendRequest(request);

      await client.close();

      expect(response.error).toBeUndefined();

      const result = ToolCallResultStub(response.result as never);

      expect(result.content[0]?.type).toBe('text');
      expect(result.content[0]?.text).toMatch(/^.*# Testing Patterns & Philosophy.*$/su);
    });
  });

  describe('tools/call with discover', () => {
    it('VALID: {type: files, path: src/brokers} => returns tree format', async () => {
      const client = await createMcpClient();

      const request = JsonRpcRequestStub({
        id: RpcIdStub({ value: 4 }),
        method: RpcMethodStub({ value: 'tools/call' }),
        params: {
          name: 'discover',
          arguments: {
            type: 'files',
            path: 'src/brokers',
          },
        },
      });

      const response = await client.sendRequest(request);

      await client.close();

      expect(response.error).toBeUndefined();

      const result = ToolCallResultStub(response.result as never);
      const [firstContent] = result.content;

      expect(firstContent).toBeDefined();

      const parsedData: unknown = JSON.parse(String(firstContent!.text));
      const data = DiscoverTreeResultStub(parsedData as never);

      expect(typeof data.results).toBe('string');
      expect(data.count).toBeGreaterThan(0);
    });

    it('VALID: {type: files, fileType: adapter} => returns adapters from @dungeonmaster/shared', async () => {
      const client = await createMcpClient();

      const request = JsonRpcRequestStub({
        id: RpcIdStub({ value: 5 }),
        method: RpcMethodStub({ value: 'tools/call' }),
        params: {
          name: 'discover',
          arguments: {
            type: 'files',
            fileType: 'adapter',
          },
        },
      });

      const response = await client.sendRequest(request);

      await client.close();

      expect(response.error).toBeUndefined();

      const result = ToolCallResultStub(response.result as never);
      const [firstContent] = result.content;

      expect(firstContent).toBeDefined();

      const parsedData: unknown = JSON.parse(String(firstContent!.text));
      const data = DiscoverTreeResultStub(parsedData as never);

      expect(data.results).toMatch(/@dungeonmaster\/\n\s+shared\//u);
    });

    it('VALID: {type: files, fileType: adapter} => shared package includes fs-access-adapter', async () => {
      const client = await createMcpClient();

      const request = JsonRpcRequestStub({
        id: RpcIdStub({ value: 6 }),
        method: RpcMethodStub({ value: 'tools/call' }),
        params: {
          name: 'discover',
          arguments: {
            type: 'files',
            fileType: 'adapter',
          },
        },
      });

      const response = await client.sendRequest(request);

      await client.close();

      expect(response.error).toBeUndefined();

      const result = ToolCallResultStub(response.result as never);
      const [firstContent] = result.content;

      expect(firstContent).toBeDefined();

      const parsedData: unknown = JSON.parse(String(firstContent!.text));
      const data = DiscoverTreeResultStub(parsedData as never);

      expect(data.results).toMatch(/fs-access-adapter \(adapter\)/u);
    });
  });

  describe('invalid tool calls', () => {
    it('ERROR: {name: unknown-tool} => returns error', async () => {
      const client = await createMcpClient();

      const request = JsonRpcRequestStub({
        id: RpcIdStub({ value: 999 }),
        method: RpcMethodStub({ value: 'tools/call' }),
        params: {
          name: 'unknown-tool',
          arguments: {},
        },
      });

      const response = await client.sendRequest(request);

      await client.close();

      expect(response.error).toBeDefined();
      expect(response.error?.message).toMatch(/^.*Unknown tool.*$/u);
    });
  });
});
