/**
 * Integration test for McpServerFlow - tests actual function via subprocess
 * No mocks - spawns real server and communicates via stdio
 *
 * OPTIMIZATION: Uses a single shared server process for all tests to avoid
 * repeated subprocess spawn + 2s startup delay per test (16 tests x 2s = 32s saved)
 */

import { QuestStub } from '@dungeonmaster/shared/contracts';

import { JsonRpcRequestStub } from '../../contracts/json-rpc-request/json-rpc-request.stub';
import { RpcIdStub } from '../../contracts/rpc-id/rpc-id.stub';
import { RpcMethodStub } from '../../contracts/rpc-method/rpc-method.stub';
import { ToolListResultStub } from '../../contracts/tool-list-result/tool-list-result.stub';
import { ToolCallResultStub } from '../../contracts/tool-call-result/tool-call-result.stub';
import { DiscoverTreeResultStub } from '../../contracts/discover-tree-result/discover-tree-result.stub';
import { GetQuestResultStub } from '../../contracts/get-quest-result/get-quest-result.stub';
import { ModifyQuestResultStub } from '../../contracts/modify-quest-result/modify-quest-result.stub';

import { mcpServerHarness } from '../../../test/harnesses/mcp-server/mcp-server.harness';

describe('McpServerFlow', () => {
  const mcp = mcpServerHarness();

  let client: Awaited<ReturnType<typeof mcp.createClient>>;

  beforeAll(async () => {
    client = await mcp.createClient();
  });

  afterAll(async () => {
    await client.close();
  });

  describe('initialization', () => {
    it('VALID: Server starts and responds to initialize request', async () => {
      const request = mcp.buildInitRequest();

      const response = await client.sendRequest(request);

      const { error, result } = response;

      expect(error).toBe(undefined);
      expect(result).not.toBe(undefined);
    });
  });

  describe('tools/list', () => {
    it('VALID: Returns at least 5 tools including all expected tools', async () => {
      const request = mcp.buildToolListRequest();

      const response = await client.sendRequest(request);

      expect(response.error).toBe(undefined);

      const result = ToolListResultStub(response.result as never);

      expect(result.tools.length).toBeGreaterThanOrEqual(5);

      const discoverTool = result.tools.find((tool) => tool.name === 'discover');
      const architectureTool = result.tools.find((tool) => tool.name === 'get-architecture');

      expect(discoverTool?.name).toBe('discover');
      expect(architectureTool?.name).toBe('get-architecture');
    });

    it('VALID: All tool inputSchemas have type: "object" at root (required by Claude Code)', async () => {
      const request = JsonRpcRequestStub({
        id: RpcIdStub({ value: 100 }),
        method: RpcMethodStub({ value: 'tools/list' }),
        params: {},
      });

      const response = await client.sendRequest(request);

      expect(response.error).toBe(undefined);

      const result = ToolListResultStub(response.result as never);

      const toolsWithBadSchema = result.tools.filter((tool) => tool.inputSchema.type !== 'object');

      expect(toolsWithBadSchema).toStrictEqual([]);
    });
  });

  describe('tools/call with get-architecture', () => {
    it('VALID: Returns architecture overview markdown', async () => {
      const request = JsonRpcRequestStub({
        id: RpcIdStub({ value: 3 }),
        method: RpcMethodStub({ value: 'tools/call' }),
        params: {
          name: 'get-architecture',
          arguments: {},
        },
      });

      const response = await client.sendRequest(request);

      expect(response.error).toBe(undefined);

      const result = ToolCallResultStub(response.result as never);

      expect(result.content[0]?.type).toBe('text');
      expect(result.content[0]?.text).toContain('# Architecture Overview');
    });
  });

  describe('tools/call with get-testing-patterns', () => {
    it('VALID: Returns testing patterns markdown', async () => {
      const request = JsonRpcRequestStub({
        id: RpcIdStub({ value: 13 }),
        method: RpcMethodStub({ value: 'tools/call' }),
        params: {
          name: 'get-testing-patterns',
          arguments: {},
        },
      });

      const response = await client.sendRequest(request);

      expect(response.error).toBe(undefined);

      const result = ToolCallResultStub(response.result as never);

      expect(result.content[0]?.type).toBe('text');
      expect(result.content[0]?.text).toContain('# Testing Patterns & Philosophy');
    });
  });

  describe('tools/call with discover', () => {
    it('VALID: {type: files, path: src/brokers} => returns tree format', async () => {
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

      expect(response.error).toBe(undefined);

      const result = ToolCallResultStub(response.result as never);
      const [firstContent] = result.content;

      const parsedData: unknown = JSON.parse(String(firstContent!.text));
      const data = DiscoverTreeResultStub(parsedData as never);

      const { results, count } = data;

      expect(results).toContain('broker');
      expect(count).toBeGreaterThan(0);
    });

    it('VALID: {type: files, fileType: adapter} => returns adapters from @dungeonmaster/shared', async () => {
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

      expect(response.error).toBe(undefined);

      const result = ToolCallResultStub(response.result as never);
      const [firstContent] = result.content;

      const parsedData: unknown = JSON.parse(String(firstContent!.text));
      const data = DiscoverTreeResultStub(parsedData as never);

      expect(data.results).toContain('adapters/');
    });

    it('VALID: {type: files, fileType: adapter} => shared package includes fs-access-adapter', async () => {
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

      expect(response.error).toBe(undefined);

      const result = ToolCallResultStub(response.result as never);
      const [firstContent] = result.content;

      const parsedData: unknown = JSON.parse(String(firstContent!.text));
      const data = DiscoverTreeResultStub(parsedData as never);

      expect(data.results).toContain('fs-access-adapter (adapter)');
    });
  });

  describe('invalid tool calls', () => {
    it('ERROR: {name: unknown-tool} => returns error', async () => {
      const request = JsonRpcRequestStub({
        id: RpcIdStub({ value: 999 }),
        method: RpcMethodStub({ value: 'tools/call' }),
        params: {
          name: 'unknown-tool',
          arguments: {},
        },
      });

      const response = await client.sendRequest(request);

      expect(response.error?.message).toContain('Unknown tool');
    });
  });

  describe('quest tools storage consistency', () => {
    it('VALID: get-quest => retrieves a pre-seeded quest', async () => {
      const questId = 'storage-test-quest';
      const guildId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
      const questFolder = '001-storage-test-quest';

      const quest = QuestStub({
        id: questId as never,
        folder: questFolder as never,
        title: 'Storage Test Quest' as never,
        status: 'created' as never,
        userRequest: 'Testing storage consistency' as never,
      });

      mcp.seedQuest({
        dungeonmasterHome: client.dungeonmasterHome,
        guildId,
        questFolder,
        quest,
      });

      const getQuestRequest = JsonRpcRequestStub({
        id: RpcIdStub({ value: 1004 }),
        method: RpcMethodStub({ value: 'tools/call' }),
        params: {
          name: 'get-quest',
          arguments: {
            questId,
            format: 'json',
          },
        },
      });

      const getResponse = await client.sendRequest(getQuestRequest);

      const getResult = ToolCallResultStub(getResponse.result as never);
      const [getContent] = getResult.content;
      const getParsedData: unknown = JSON.parse(String(getContent!.text));
      const getResultData = GetQuestResultStub(getParsedData as never);

      expect(getResponse.error).toBe(undefined);
      expect(getResultData.success).toBe(true);
      expect(getResultData.quest!.id).toBe(questId);
    });

    it('VALID: modify-quest => get-quest => retrieves modified quest with new design decision', async () => {
      const questId = 'modify-flow-quest';
      const guildId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
      const questFolder = '001-modify-flow-quest';

      const quest = QuestStub({
        id: questId as never,
        folder: questFolder as never,
        title: 'Modify Flow Quest' as never,
        status: 'created' as never,
        userRequest: 'Testing modify flow' as never,
      });

      mcp.seedQuest({
        dungeonmasterHome: client.dungeonmasterHome,
        guildId,
        questFolder,
        quest,
      });

      const modifyQuestRequest = JsonRpcRequestStub({
        id: RpcIdStub({ value: 2002 }),
        method: RpcMethodStub({ value: 'tools/call' }),
        params: {
          name: 'modify-quest',
          arguments: {
            questId,
            designDecisions: [
              {
                id: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
                title: 'Use JWT for auth',
                rationale: 'Added via modify-quest',
                relatedNodeIds: [],
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
            questId,
            format: 'json',
          },
        },
      });

      const getResponse = await client.sendRequest(getQuestRequest);

      const getResult = ToolCallResultStub(getResponse.result as never);
      const [getContent] = getResult.content;
      const getParsedData: unknown = JSON.parse(String(getContent!.text));
      const getResultData = GetQuestResultStub(getParsedData as never);

      expect(modifyResponse.error).toBe(undefined);
      expect(modifyResultData.success).toBe(true);
      expect(getResponse.error).toBe(undefined);

      const { success: getSuccess, quest: retrievedQuest } = getResultData;

      expect(getSuccess).toBe(true);
      expect(retrievedQuest!.designDecisions).toStrictEqual([
        {
          id: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
          title: 'Use JWT for auth',
          rationale: 'Added via modify-quest',
          relatedNodeIds: [],
        },
      ]);
    });

    it('ERROR: get-quest with non-existent questId => returns error', async () => {
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

      const getResult = ToolCallResultStub(getResponse.result as never);
      const [getContent] = getResult.content;
      const getParsedData: unknown = JSON.parse(String(getContent!.text));
      const getResultData = GetQuestResultStub(getParsedData as never);

      expect(getResponse.error).toBe(undefined);

      const { success, error } = getResultData;

      expect(success).toBe(false);
      expect(String(error)).toStrictEqual(expect.stringMatching(/(?:not found|ENOENT)/iu));
    });

    it('ERROR: get-quest with non-existent questId => sets isError true on tool result', async () => {
      const getQuestRequest = JsonRpcRequestStub({
        id: RpcIdStub({ value: 3002 }),
        method: RpcMethodStub({ value: 'tools/call' }),
        params: {
          name: 'get-quest',
          arguments: {
            questId: 'non-existent-quest-id',
          },
        },
      });

      const getResponse = await client.sendRequest(getQuestRequest);

      const getResult = ToolCallResultStub(getResponse.result as never);

      expect(getResponse.error).toBe(undefined);
      expect(getResult.isError).toBe(true);
    });

    it('VALID: get-quest with existing quest => does not set isError', async () => {
      const questId = 'is-error-success-test';
      const guildId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
      const questFolder = '001-is-error-success-test';

      const quest = QuestStub({
        id: questId as never,
        folder: questFolder as never,
        title: 'IsError Success Test' as never,
        status: 'created' as never,
        userRequest: 'Testing isError not set on success' as never,
      });

      mcp.seedQuest({
        dungeonmasterHome: client.dungeonmasterHome,
        guildId,
        questFolder,
        quest,
      });

      const getQuestRequest = JsonRpcRequestStub({
        id: RpcIdStub({ value: 3003 }),
        method: RpcMethodStub({ value: 'tools/call' }),
        params: {
          name: 'get-quest',
          arguments: {
            questId,
          },
        },
      });

      const getResponse = await client.sendRequest(getQuestRequest);

      const getResult = ToolCallResultStub(getResponse.result as never);

      expect(getResponse.error).toBe(undefined);
      expect(getResult.isError).toBe(undefined);
    });
  });

  describe('tools/call with get-folder-detail', () => {
    it('VALID: {folderType: brokers} => returns brokers folder documentation', async () => {
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

      expect(response.error).toBe(undefined);

      const result = ToolCallResultStub(response.result as never);

      expect(result.content[0]?.type).toBe('text');
      expect(result.content[0]?.text).toContain('brokers');
    });
  });

  describe('tools/call with get-syntax-rules', () => {
    it('VALID: {} => returns syntax rules markdown', async () => {
      const request = JsonRpcRequestStub({
        id: RpcIdStub({ value: 5001 }),
        method: RpcMethodStub({ value: 'tools/call' }),
        params: {
          name: 'get-syntax-rules',
          arguments: {},
        },
      });

      const response = await client.sendRequest(request);

      expect(response.error).toBe(undefined);

      const result = ToolCallResultStub(response.result as never);

      expect(result.content[0]?.type).toBe('text');
      expect(result.content[0]?.text).toContain('# Universal Syntax');
    });
  });

  describe('tools/call with discover standards', () => {
    it('VALID: {type: standards} => returns JSON response with results array', async () => {
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

      expect(response.error).toBe(undefined);

      const result = ToolCallResultStub(response.result as never);

      expect(result.content[0]?.type).toBe('text');

      const parsedData: unknown = JSON.parse(String(result.content[0]?.text));

      expect(parsedData).toStrictEqual({
        results: [],
        count: 0,
      });
    });
  });

  describe('tools/call with ask-user-question', () => {
    it('VALID: {questions array with single question} => returns instruction text', async () => {
      const request = JsonRpcRequestStub({
        id: RpcIdStub({ value: 9001 }),
        method: RpcMethodStub({ value: 'tools/call' }),
        params: {
          name: 'ask-user-question',
          arguments: {
            questions: [
              {
                question: 'Which DB?',
                header: 'Database',
                options: [
                  { label: 'Postgres', description: 'Relational' },
                  { label: 'Mongo', description: 'Document' },
                ],
                multiSelect: false,
              },
            ],
          },
        },
      });

      const response = await client.sendRequest(request);

      expect(response.error).toBe(undefined);

      const result = ToolCallResultStub(response.result as never);

      expect(result.content[0]?.type).toBe('text');
      expect(result.content[0]?.text).toContain('Questions sent to user');
    });

    it('ERROR: {empty questions array} => returns error', async () => {
      const request = JsonRpcRequestStub({
        id: RpcIdStub({ value: 9002 }),
        method: RpcMethodStub({ value: 'tools/call' }),
        params: {
          name: 'ask-user-question',
          arguments: {
            questions: [],
          },
        },
      });

      const response = await client.sendRequest(request);

      expect(response.error).not.toBe(undefined);
    });
  });
});
