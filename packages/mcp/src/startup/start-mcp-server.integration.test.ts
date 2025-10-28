/**
 * Integration test for StartMcpServer - tests actual function via subprocess
 * No mocks - spawns real server and communicates via stdio
 */

import { StartMcpServerProxy } from './start-mcp-server.proxy';
import { JsonRpcRequestStub } from '../contracts/json-rpc-request/json-rpc-request.stub';
import { RpcIdStub } from '../contracts/rpc-id/rpc-id.stub';
import { RpcMethodStub } from '../contracts/rpc-method/rpc-method.stub';
import { ToolListResultStub } from '../contracts/tool-list-result/tool-list-result.stub';
import { ToolCallResultStub } from '../contracts/tool-call-result/tool-call-result.stub';
import { DiscoverResultStub } from '../contracts/discover-result/discover-result.stub';

describe('StartMcpServer', () => {
  describe('initialization', () => {
    it('VALID: Server starts and responds to initialize request', async () => {
      const proxy = StartMcpServerProxy();
      const client = await proxy.createClient();

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
    it('VALID: Returns discover tool in list', async () => {
      const proxy = StartMcpServerProxy();
      const client = await proxy.createClient();

      const request = JsonRpcRequestStub({
        id: RpcIdStub({ value: 2 }),
        method: RpcMethodStub({ value: 'tools/list' }),
        params: {},
      });

      const response = await client.sendRequest(request);

      expect(response.error).toBeUndefined();

      const result = ToolListResultStub(response.result as never);

      await client.close();

      expect(result.tools).toStrictEqual([
        {
          name: 'discover',
          description: 'Discover utilities, brokers, standards across the codebase',
          inputSchema: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['files', 'standards'],
                description: 'Type of discovery: files or standards',
              },
              path: {
                type: 'string',
                description: 'Path to search (for files)',
              },
              fileType: {
                type: 'string',
                description: 'File type to filter (broker, widget, guard, etc.)',
              },
              search: {
                type: 'string',
                description: 'Search query',
              },
              name: {
                type: 'string',
                description: 'Specific file name',
              },
              section: {
                type: 'string',
                description: 'Standards section path (for standards)',
              },
            },
            required: ['type'],
          },
        },
      ]);
    });
  });

  describe('tools/call - discover tool', () => {
    it('VALID: Discover tool responds without errors', async () => {
      const proxy = StartMcpServerProxy();
      const client = await proxy.createClient();

      const request = JsonRpcRequestStub({
        id: RpcIdStub({ value: 3 }),
        method: RpcMethodStub({ value: 'tools/call' }),
        params: {
          name: 'discover',
          arguments: {
            type: 'files',
          },
        },
      });

      const response = await client.sendRequest(request);

      expect(response.error).toBeUndefined();

      const result = ToolCallResultStub(response.result as never);

      expect(result.content).toHaveLength(1);

      const [firstContent] = result.content;

      expect(firstContent!.type).toBe('text');

      const parsedContent = DiscoverResultStub(JSON.parse(firstContent!.text) as never);

      await client.close();

      expect(firstContent).toStrictEqual({
        type: 'text',
        text: JSON.stringify(parsedContent, null, 2),
      });
    });

    it('ERROR: Unknown tool name returns error', async () => {
      const proxy = StartMcpServerProxy();
      const client = await proxy.createClient();

      const request = JsonRpcRequestStub({
        id: RpcIdStub({ value: 5 }),
        method: RpcMethodStub({ value: 'tools/call' }),
        params: {
          name: 'nonexistent-tool',
          arguments: {},
        },
      });

      const response = await client.sendRequest(request);

      await client.close();

      expect(response.result).toBeUndefined();

      expect(response.error).toStrictEqual({
        code: -32603,
        message: 'Unknown tool: nonexistent-tool',
      });
    });

    it('ERROR: Invalid discover arguments returns validation error', async () => {
      const proxy = StartMcpServerProxy();
      const client = await proxy.createClient();

      const request = JsonRpcRequestStub({
        id: RpcIdStub({ value: 6 }),
        method: RpcMethodStub({ value: 'tools/call' }),
        params: {
          name: 'discover',
          arguments: {
            fileType: 'broker',
          },
        },
      });

      const response = await client.sendRequest(request);

      await client.close();

      expect(response.result).toBeUndefined();

      expect(response.error?.code).toBe(-32603);
    });
  });

  describe('standards discovery', () => {
    it('VALID: Discovers standards sections from project', async () => {
      const proxy = StartMcpServerProxy();
      const client = await proxy.createClient();

      const request = JsonRpcRequestStub({
        id: RpcIdStub({ value: 7 }),
        method: RpcMethodStub({ value: 'tools/call' }),
        params: {
          name: 'discover',
          arguments: {
            type: 'standards',
          },
        },
      });

      const response = await client.sendRequest(request);

      expect(response.error).toBeUndefined();

      const result = ToolCallResultStub(response.result as never);

      expect(result.content).toHaveLength(1);

      const [firstContent] = result.content;

      expect(firstContent!.type).toBe('text');

      const parsedContent = DiscoverResultStub(JSON.parse(firstContent!.text) as never);

      await client.close();

      expect(firstContent).toStrictEqual({
        type: 'text',
        text: JSON.stringify(parsedContent, null, 2),
      });
    });
  });
});
