/**
 * Integration test for StartMcpServer - tests actual function via subprocess
 * No mocks - spawns real server and communicates via stdio
 */

import { spawn } from 'child_process';
import * as path from 'path';
import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';
import { JsonRpcRequestStub } from '../contracts/json-rpc-request/json-rpc-request.stub';
import { JsonRpcResponseStub } from '../contracts/json-rpc-response/json-rpc-response.stub';
import { RpcIdStub } from '../contracts/rpc-id/rpc-id.stub';
import { RpcMethodStub } from '../contracts/rpc-method/rpc-method.stub';
import { ToolListResultStub } from '../contracts/tool-list-result/tool-list-result.stub';
import { ToolCallResultStub } from '../contracts/tool-call-result/tool-call-result.stub';
import { DiscoverTreeResultStub } from '../contracts/discover-tree-result/discover-tree-result.stub';
import { AddQuestResultStub } from '../contracts/add-quest-result/add-quest-result.stub';
import { GetQuestResultStub } from '../contracts/get-quest-result/get-quest-result.stub';
import { ModifyQuestResultStub } from '../contracts/modify-quest-result/modify-quest-result.stub';
import { mcpServerStatics } from '../statics/mcp-server/mcp-server-statics';
import type { McpServerClientStub } from '../contracts/mcp-server-client/mcp-server-client.stub';
import { BufferStateStub } from '../contracts/buffer-state/buffer-state.stub';

type JsonRpcResponse = ReturnType<typeof JsonRpcResponseStub>;
type JsonRpcRequest = ReturnType<typeof JsonRpcRequestStub>;
type RpcId = ReturnType<typeof RpcIdStub>;
type McpServerClient = ReturnType<typeof McpServerClientStub>;

const createMcpClient = async (): Promise<McpServerClient> => {
  const serverEntryPoint = path.join(__dirname, '../index.ts');

  // Create isolated temp directory using testbed
  const testbed = installTestbedCreateBroker({
    baseName: BaseNameStub({ value: 'mcp-server' }),
  });

  const serverProcess = spawn('npx', ['tsx', serverEntryPoint], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: testbed.guildPath,
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

          // Clean up temp directory
          testbed.cleanup();

          resolve();
        });

        serverProcess.stdout.off('data', dataHandler);

        serverProcess.kill();
      }),
  };
};

jest.setTimeout(30_000);

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

  describe('quest tools storage consistency', () => {
    it('VALID: add-quest => creates quest successfully', async () => {
      const client = await createMcpClient();

      const addQuestRequest = JsonRpcRequestStub({
        id: RpcIdStub({ value: 1001 }),
        method: RpcMethodStub({ value: 'tools/call' }),
        params: {
          name: 'add-quest',
          arguments: {
            title: 'Integration Test Quest',
            userRequest: 'Testing add-quest creates quest',
            guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            tasks: [
              {
                id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
                name: 'Test task',
                type: 'testing',
              },
            ],
          },
        },
      });

      const addResponse = await client.sendRequest(addQuestRequest);

      await client.close();

      const addResult = ToolCallResultStub(addResponse.result as never);
      const [addContent] = addResult.content;
      const addParsedData: unknown = JSON.parse(String(addContent!.text));
      const addResultData = AddQuestResultStub(addParsedData as never);

      expect(addResponse.error).toBeUndefined();
      expect(addResultData.success).toBe(true);
      expect(addResultData.questId).toBe('integration-test-quest');
    });

    it('VALID: add-quest then get-quest => retrieves the created quest', async () => {
      const client = await createMcpClient();

      const addQuestRequest = JsonRpcRequestStub({
        id: RpcIdStub({ value: 1003 }),
        method: RpcMethodStub({ value: 'tools/call' }),
        params: {
          name: 'add-quest',
          arguments: {
            title: 'Storage Test Quest',
            userRequest: 'Testing storage consistency',
            guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            tasks: [],
          },
        },
      });

      const addResponse = await client.sendRequest(addQuestRequest);
      const addResult = ToolCallResultStub(addResponse.result as never);
      const [addContent] = addResult.content;
      const addParsedData: unknown = JSON.parse(String(addContent!.text));
      const addResultData = AddQuestResultStub(addParsedData as never);

      const getQuestRequest = JsonRpcRequestStub({
        id: RpcIdStub({ value: 1004 }),
        method: RpcMethodStub({ value: 'tools/call' }),
        params: {
          name: 'get-quest',
          arguments: {
            questId: addResultData.questId,
          },
        },
      });

      const getResponse = await client.sendRequest(getQuestRequest);

      await client.close();

      const getResult = ToolCallResultStub(getResponse.result as never);
      const [getContent] = getResult.content;
      const getParsedData: unknown = JSON.parse(String(getContent!.text));
      const getResultData = GetQuestResultStub(getParsedData as never);

      expect(getResponse.error).toBeUndefined();
      expect(getResultData.success).toBe(true);
      expect(getResultData.quest!.id).toBe(addResultData.questId);
    });

    it('VALID: add-quest => modify-quest => get-quest => retrieves modified quest with new context', async () => {
      const client = await createMcpClient();

      const addQuestRequest = JsonRpcRequestStub({
        id: RpcIdStub({ value: 2001 }),
        method: RpcMethodStub({ value: 'tools/call' }),
        params: {
          name: 'add-quest',
          arguments: {
            title: 'Modify Flow Quest',
            userRequest: 'Testing modify flow',
            guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            tasks: [
              {
                id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
                name: 'Initial task',
                type: 'implementation',
              },
            ],
          },
        },
      });

      const addResponse = await client.sendRequest(addQuestRequest);
      const addResult = ToolCallResultStub(addResponse.result as never);
      const [addContent] = addResult.content;
      const addParsedData: unknown = JSON.parse(String(addContent!.text));
      const addResultData = AddQuestResultStub(addParsedData as never);

      const modifyQuestRequest = JsonRpcRequestStub({
        id: RpcIdStub({ value: 2002 }),
        method: RpcMethodStub({ value: 'tools/call' }),
        params: {
          name: 'modify-quest',
          arguments: {
            questId: addResultData.questId,
            contexts: [
              {
                id: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
                name: 'Test Context',
                description: 'Added via modify-quest',
                locator: { section: 'testing', page: 'integration' },
              },
            ],
          },
        },
      });

      const modifyResponse = await client.sendRequest(modifyQuestRequest);
      const modifyResult = ToolCallResultStub(modifyResponse.result as never);
      const [modifyContent] = modifyResult.content;
      const modifyParsedData: unknown = JSON.parse(String(modifyContent!.text));
      const modifyResultData = ModifyQuestResultStub(modifyParsedData as never);

      const getQuestRequest = JsonRpcRequestStub({
        id: RpcIdStub({ value: 2003 }),
        method: RpcMethodStub({ value: 'tools/call' }),
        params: {
          name: 'get-quest',
          arguments: {
            questId: addResultData.questId,
          },
        },
      });

      const getResponse = await client.sendRequest(getQuestRequest);

      await client.close();

      const getResult = ToolCallResultStub(getResponse.result as never);
      const [getContent] = getResult.content;
      const getParsedData: unknown = JSON.parse(String(getContent!.text));
      const getResultData = GetQuestResultStub(getParsedData as never);

      expect(modifyResponse.error).toBeUndefined();
      expect(modifyResultData.success).toBe(true);
      expect(getResponse.error).toBeUndefined();
      expect(getResultData.success).toBe(true);
      expect(getResultData.quest!.contexts).toStrictEqual([
        {
          id: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
          name: 'Test Context',
          description: 'Added via modify-quest',
          locator: { section: 'testing', page: 'integration' },
        },
      ]);
    });

    it('ERROR: get-quest with non-existent questId => returns error', async () => {
      const client = await createMcpClient();

      const getQuestRequest = JsonRpcRequestStub({
        id: RpcIdStub({ value: 3001 }),
        method: RpcMethodStub({ value: 'tools/call' }),
        params: {
          name: 'get-quest',
          arguments: {
            questId: 'non-existent-quest-id',
          },
        },
      });

      const getResponse = await client.sendRequest(getQuestRequest);

      await client.close();

      const getResult = ToolCallResultStub(getResponse.result as never);
      const [getContent] = getResult.content;
      const getParsedData: unknown = JSON.parse(String(getContent!.text));
      const getResultData = GetQuestResultStub(getParsedData as never);

      expect(getResponse.error).toBeUndefined();
      expect(getResultData.success).toBe(false);
      expect(getResultData.error).toMatch(/not found|ENOENT/iu);
    });
  });

  describe('tools/call with get-folder-detail', () => {
    it('VALID: {folderType: brokers} => returns brokers folder documentation', async () => {
      const client = await createMcpClient();

      const request = JsonRpcRequestStub({
        id: RpcIdStub({ value: 4001 }),
        method: RpcMethodStub({ value: 'tools/call' }),
        params: {
          name: 'get-folder-detail',
          arguments: {
            folderType: 'brokers',
          },
        },
      });

      const response = await client.sendRequest(request);

      await client.close();

      expect(response.error).toBeUndefined();

      const result = ToolCallResultStub(response.result as never);

      expect(result.content[0]?.type).toBe('text');
      expect(result.content[0]?.text).toMatch(/^.*brokers.*$/su);
    });
  });

  describe('tools/call with get-syntax-rules', () => {
    it('VALID: {} => returns syntax rules markdown', async () => {
      const client = await createMcpClient();

      const request = JsonRpcRequestStub({
        id: RpcIdStub({ value: 5001 }),
        method: RpcMethodStub({ value: 'tools/call' }),
        params: {
          name: 'get-syntax-rules',
          arguments: {},
        },
      });

      const response = await client.sendRequest(request);

      await client.close();

      expect(response.error).toBeUndefined();

      const result = ToolCallResultStub(response.result as never);

      expect(result.content[0]?.type).toBe('text');
      expect(result.content[0]?.text).toMatch(/^.*# Universal Syntax.*$/su);
    });
  });

  describe('tools/call with discover standards', () => {
    it('VALID: {type: standards} => returns JSON response with results array', async () => {
      const client = await createMcpClient();

      const request = JsonRpcRequestStub({
        id: RpcIdStub({ value: 7001 }),
        method: RpcMethodStub({ value: 'tools/call' }),
        params: {
          name: 'discover',
          arguments: {
            type: 'standards',
          },
        },
      });

      const response = await client.sendRequest(request);

      await client.close();

      expect(response.error).toBeUndefined();

      const result = ToolCallResultStub(response.result as never);

      expect(result.content[0]?.type).toBe('text');

      const parsedData: unknown = JSON.parse(String(result.content[0]?.text));

      expect(parsedData).toStrictEqual({
        results: [],
        count: 0,
      });
    });
  });

  describe('tools/call with ward-list', () => {
    it('VALID: {no runId} => returns ward list result text', async () => {
      const client = await createMcpClient();

      const request = JsonRpcRequestStub({
        id: RpcIdStub({ value: 8001 }),
        method: RpcMethodStub({ value: 'tools/call' }),
        params: {
          name: 'ward-list',
          arguments: {},
        },
      });

      const response = await client.sendRequest(request);

      await client.close();

      expect(response.error).toBeUndefined();

      const result = ToolCallResultStub(response.result as never);

      expect(result.content[0]?.type).toBe('text');
      expect(result.content[0]?.text).toMatch(/ward|No ward|errors/u);
    });
  });

  describe('tools/call with ward-detail', () => {
    it('VALID: {runId, filePath} => returns ward detail result text', async () => {
      const client = await createMcpClient();

      const request = JsonRpcRequestStub({
        id: RpcIdStub({ value: 8002 }),
        method: RpcMethodStub({ value: 'tools/call' }),
        params: {
          name: 'ward-detail',
          arguments: {
            runId: '1739625600000-a3f1',
            filePath: 'src/app.ts',
          },
        },
      });

      const response = await client.sendRequest(request);

      await client.close();

      expect(response.error).toBeUndefined();

      const result = ToolCallResultStub(response.result as never);

      expect(result.content[0]?.type).toBe('text');
      expect(result.content[0]?.text).toMatch(/ward|No ward|src\/app\.ts/u);
    });
  });

  describe('tools/call with ward-raw', () => {
    it('VALID: {runId, checkType} => returns ward raw result text', async () => {
      const client = await createMcpClient();

      const request = JsonRpcRequestStub({
        id: RpcIdStub({ value: 8003 }),
        method: RpcMethodStub({ value: 'tools/call' }),
        params: {
          name: 'ward-raw',
          arguments: {
            runId: '1739625600000-a3f1',
            checkType: 'lint',
          },
        },
      });

      const response = await client.sendRequest(request);

      await client.close();

      expect(response.error).toBeUndefined();

      const result = ToolCallResultStub(response.result as never);

      expect(result.content[0]?.type).toBe('text');
      expect(result.content[0]?.text).toMatch(/ward|No ward|lint|output/u);
    });
  });
});
