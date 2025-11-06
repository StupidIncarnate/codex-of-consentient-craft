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
import { DiscoverTreeResultStub } from '../contracts/discover-tree-result/discover-tree-result.stub';

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

      // Verify tools are present - exact schema tested in unit tests
      expect(result.tools.length).toBeGreaterThanOrEqual(5);
      expect(result.tools).toContainEqual(
        expect.objectContaining({
          name: 'discover',
          description: expect.stringContaining('Discover'),
        }),
      );
      expect(result.tools).toContainEqual(
        expect.objectContaining({
          name: 'get-architecture',
          description: expect.stringContaining('architecture'),
        }),
      );
      expect(result.tools).toContainEqual(
        expect.objectContaining({
          name: 'get-folder-detail',
          description: expect.stringContaining('folder'),
        }),
      );
      expect(result.tools).toContainEqual(
        expect.objectContaining({
          name: 'get-syntax-rules',
          description: expect.stringContaining('syntax'),
        }),
      );
      expect(result.tools).toContainEqual(
        expect.objectContaining({
          name: 'get-testing-patterns',
          description: expect.stringContaining('testing'),
        }),
      );
    });
  });

  describe('tools/call with get-architecture', () => {
    it('VALID: Returns architecture overview markdown', async () => {
      const proxy = StartMcpServerProxy();
      const client = await proxy.createClient();

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

      expect(result.content[0]).toStrictEqual(
        expect.objectContaining({
          type: 'text',
          text: expect.stringContaining('# Architecture Overview'),
        }),
      );
    });
  });

  describe('tools/call with get-testing-patterns', () => {
    it('VALID: Returns testing patterns markdown', async () => {
      const proxy = StartMcpServerProxy();
      const client = await proxy.createClient();

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

      expect(result.content[0]).toStrictEqual(
        expect.objectContaining({
          type: 'text',
          text: expect.stringContaining('# Testing Patterns & Philosophy'),
        }),
      );
    });
  });

  describe('tools/call with discover', () => {
    it('VALID: {type: files, path: src/brokers} => returns tree format', async () => {
      const proxy = StartMcpServerProxy();
      const client = await proxy.createClient();

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
      const data = DiscoverTreeResultStub(JSON.parse(result.content[0]?.text ?? '{}') as never);

      expect(typeof data.results).toStrictEqual('string');
      expect(data.count).toBeGreaterThan(0);
    });
  });

  describe('invalid tool calls', () => {
    it('ERROR: {name: unknown-tool} => returns error', async () => {
      const proxy = StartMcpServerProxy();
      const client = await proxy.createClient();

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
      expect(response.error?.message).toMatch(/Unknown tool/u);
    });
  });
});
