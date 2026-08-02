/**
 * Integration test for McpServerFlow - tests actual function via subprocess
 * No mocks - spawns real server and communicates via stdio
 *
 * OPTIMIZATION: Uses a single shared server process for all tests to avoid
 * repeated subprocess spawn + 2s startup delay per test (16 tests x 2s = 32s saved)
 */

import {
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  QuestCommentStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';
import { mcpToolsStatics } from '@dungeonmaster/shared/statics';

import { JsonRpcRequestStub } from '../../contracts/json-rpc-request/json-rpc-request.stub';
import { RpcIdStub } from '../../contracts/rpc-id/rpc-id.stub';
import { RpcMethodStub } from '../../contracts/rpc-method/rpc-method.stub';
import { ToolListResultStub } from '../../contracts/tool-list-result/tool-list-result.stub';
import { ToolCallResultStub } from '../../contracts/tool-call-result/tool-call-result.stub';
import { DiscoverTreeResultStub } from '../../contracts/discover-tree-result/discover-tree-result.stub';
import { GetQuestResultStub } from '@dungeonmaster/shared/contracts';
import { ModifyQuestResultStub } from '@dungeonmaster/shared/contracts';

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

      expect(response.error).toBe(undefined);
      expect(JSON.stringify(response.result)).toMatch(
        /^\{"protocolVersion":"2024-11-05","capabilities":\{"tools":\{\}\},"serverInfo":\{"name":"@dungeonmaster\/mcp","version":"0\.1\.0"\}\}$/u,
      );
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
      expect(result.content[0]?.text).toMatch(/^# Architecture Overview$/mu);
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
      expect(result.content[0]?.text).toMatch(/^# Testing Patterns & Philosophy$/mu);
    });
  });

  describe('tools/call with discover', () => {
    it('VALID: {glob: src/brokers/**} => returns tree format with zero count (temp dir has no source)', async () => {
      const request = JsonRpcRequestStub({
        id: RpcIdStub({ value: 4 }),
        method: RpcMethodStub({ value: 'tools/call' }),
        params: {
          name: 'discover',
          arguments: {
            glob: 'src/brokers/**',
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

      expect(results).toBe('');
      expect(count).toBe(0);
    });

    it('VALID: {glob: **/*-adapter.*} => returns adapters from @dungeonmaster/shared', async () => {
      const request = JsonRpcRequestStub({
        id: RpcIdStub({ value: 5 }),
        method: RpcMethodStub({ value: 'tools/call' }),
        params: {
          name: 'discover',
          arguments: {
            glob: '**/*-adapter.*',
          },
        },
      });

      const response = await client.sendRequest(request);

      expect(response.error).toBe(undefined);

      const result = ToolCallResultStub(response.result as never);
      const [firstContent] = result.content;

      const parsedData: unknown = JSON.parse(String(firstContent!.text));
      const data = DiscoverTreeResultStub(parsedData as never);

      expect(data.results).toMatch(/^@dungeonmaster\/\n {2}shared\/\n {4}adapters\/\n[\s\S]+$/u);
    });

    it('VALID: {glob: **/*-adapter.*} => shared package includes fs-access-adapter', async () => {
      const request = JsonRpcRequestStub({
        id: RpcIdStub({ value: 6 }),
        method: RpcMethodStub({ value: 'tools/call' }),
        params: {
          name: 'discover',
          arguments: {
            glob: '**/*-adapter.*',
          },
        },
      });

      const response = await client.sendRequest(request);

      expect(response.error).toBe(undefined);

      const result = ToolCallResultStub(response.result as never);
      const [firstContent] = result.content;

      const parsedData: unknown = JSON.parse(String(firstContent!.text));
      const data = DiscoverTreeResultStub(parsedData as never);

      expect(data.results).toMatch(/^ {10}fs-access-adapter \(adapter\) - .+$/mu);
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

      expect(response.error?.message).toMatch(/^Unknown tool: unknown-tool$/u);
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

      // Seed quest at 'explore_flows' — that's the earliest lifecycle status that
      // permits writing designDecisions per the per-status input allowlist.
      const quest = QuestStub({
        id: questId as never,
        folder: questFolder as never,
        title: 'Modify Flow Quest' as never,
        status: 'explore_flows' as never,
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
      expect(String(error)).toMatch(
        /^Quest with id "non-existent-quest-id" not found in any guild$/u,
      );
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

  // Flow: orphan-comment-cleanup + comments-excluded-from-agent-reads. These drive the REAL
  // MCP boundary end-to-end — a spawned server subprocess, the real orchestrator, real disk —
  // which the responder/broker/transformer unit tests all mock at some layer. get-quest strips
  // comments before an agent ever sees them, so verifying a write's effect on quest.comments
  // requires reading the persisted file directly (mcp.readQuestFile), never the get-quest tool.
  describe('comment integrity at the MCP boundary', () => {
    const GUILD_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

    describe('comments-excluded-from-agent-reads — strip on read', () => {
      it('VALID: {get-quest on a quest carrying 3 distinctive comments across 2 flows} => response has no comments key, none of the 3 comment texts appear anywhere, and every other section is unchanged', async () => {
        const questId = 'comment-strip-quest';
        const questFolder = '001-comment-strip-quest';

        const submitFormNode = FlowNodeStub({
          id: 'submit-form' as never,
          label: 'Submit Form' as never,
          observables: [FlowObservableStub({ id: 'obs-one' as never })],
        });
        const loginFlow = FlowStub({
          id: 'login-flow' as never,
          nodes: [FlowNodeStub({ id: 'start' as never, label: 'Start' as never }), submitFormNode],
          edges: [],
        });
        const dashboardFlow = FlowStub({
          id: 'dashboard-flow' as never,
          name: 'Dashboard Flow' as never,
          entryPoint: '/dashboard' as never,
          exitPoints: ['/dashboard/done' as never],
          nodes: [FlowNodeStub({ id: 'widget-panel' as never, label: 'Widget Panel' as never })],
          edges: [],
        });
        const markupComment = QuestCommentStub({
          id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d101' as never,
          flowId: 'login-flow' as never,
          nodeId: 'start' as never,
          text: '<b>bold claim</b> this box is wrong' as never,
        });
        const newlineComment = QuestCommentStub({
          id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d102' as never,
          flowId: 'login-flow' as never,
          nodeId: 'submit-form' as never,
          observableId: 'obs-one' as never,
          text: 'First line of feedback\nSecond line of feedback' as never,
        });
        const otherFlowComment = QuestCommentStub({
          id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d103' as never,
          flowId: 'dashboard-flow' as never,
          nodeId: 'widget-panel' as never,
          text: 'Third distinct reviewer note on the dashboard' as never,
        });
        const quest = QuestStub({
          id: questId as never,
          folder: questFolder as never,
          title: 'Comment Strip Fixture' as never,
          status: 'flows_approved' as never,
          userRequest: 'Testing comment strip on get-quest' as never,
          flows: [loginFlow, dashboardFlow],
          comments: [markupComment, newlineComment, otherFlowComment],
        });

        mcp.seedQuest({
          dungeonmasterHome: client.dungeonmasterHome,
          guildId: GUILD_ID,
          questFolder,
          quest,
        });
        // Seeding above already wrote the full quest (with comments) to disk as a JSON
        // snapshot, so mutating `quest` in place afterward only reshapes what this test
        // EXPECTS the stripped response to look like — it cannot affect what was persisted.
        Reflect.deleteProperty(quest, 'comments');

        const request = JsonRpcRequestStub({
          id: RpcIdStub({ value: 6001 }),
          method: RpcMethodStub({ value: 'tools/call' }),
          params: {
            name: 'get-quest',
            arguments: { questId, format: 'json' },
          },
        });

        const response = await client.sendRequest(request);
        const result = ToolCallResultStub(response.result as never);
        const [content] = result.content;
        // Bare JSON.parse, deliberately NOT re-parsed through getQuestResultContract: that
        // contract's `comments` field defaults to `[]` when absent, which would silently
        // re-inject a comments key into both sides of the comparison and hide the very
        // omission this test exists to prove.
        const actual: unknown = JSON.parse(String(content!.text));

        expect(response.error).toBe(undefined);
        expect(actual).toStrictEqual({ success: true, quest });
      });
    });

    describe('orphan-comment-cleanup — silent strip on write', () => {
      it('VALID: {modify-quest comments payload from an agent} => real quest.json comments stay byte-identical and the call succeeds with no error and no failedChecks', async () => {
        const questId = 'mcp-agent-comment-block';
        const questFolder = '001-mcp-agent-comment-block';
        const flow = FlowStub({
          id: 'login-flow' as never,
          nodes: [FlowNodeStub({ id: 'start' as never, label: 'Start' as never })],
          edges: [],
        });
        const existingComment = QuestCommentStub({
          id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d201' as never,
          flowId: 'login-flow' as never,
          nodeId: 'start' as never,
          text: 'Existing user comment' as never,
        });
        const sneakyComment = QuestCommentStub({
          id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d202' as never,
          flowId: 'login-flow' as never,
          nodeId: 'start' as never,
          text: 'An agent should not be able to write this' as never,
        });
        const quest = QuestStub({
          id: questId as never,
          folder: questFolder as never,
          status: 'flows_approved' as never,
          flows: [flow],
          comments: [existingComment],
        });

        mcp.seedQuest({
          dungeonmasterHome: client.dungeonmasterHome,
          guildId: GUILD_ID,
          questFolder,
          quest,
        });

        const request = JsonRpcRequestStub({
          id: RpcIdStub({ value: 6002 }),
          method: RpcMethodStub({ value: 'tools/call' }),
          params: {
            name: 'modify-quest',
            arguments: { questId, comments: [sneakyComment] },
          },
        });

        const response = await client.sendRequest(request);
        const result = ToolCallResultStub(response.result as never);
        const [content] = result.content;
        const actual: unknown = JSON.parse(String(content!.text));
        const persisted = QuestStub(
          mcp.readQuestFile({
            dungeonmasterHome: client.dungeonmasterHome,
            guildId: GUILD_ID,
            questFolder,
          }) as never,
        );

        expect(response.error).toBe(undefined);
        expect(actual).toStrictEqual({ success: true });
        expect(persisted.comments).toStrictEqual([existingComment]);
      });

      it('VALID: {modify-quest title-only write on a quest already carrying an orphan comment} => comments stay byte-identical because no flows write means no anchor resolution runs', async () => {
        const questId = 'mcp-title-only-orphan';
        const questFolder = '001-mcp-title-only-orphan';
        const flow = FlowStub({
          id: 'login-flow' as never,
          nodes: [FlowNodeStub({ id: 'start' as never, label: 'Start' as never })],
          edges: [],
        });
        const orphanComment = QuestCommentStub({
          id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d301' as never,
          flowId: 'login-flow' as never,
          nodeId: 'ghost-node' as never,
          text: 'Anchored to a node that never existed in this write' as never,
        });
        const quest = QuestStub({
          id: questId as never,
          folder: questFolder as never,
          // explore_flows, not flows_approved: 'title' is only in the per-status allowlist at
          // explore_flows (and a few earlier statuses) — flows_approved's allowlist omits it, so
          // a title-only write there is rejected outright rather than skipping cleanup.
          status: 'explore_flows' as never,
          title: 'Old Title' as never,
          flows: [flow],
          comments: [orphanComment],
        });

        mcp.seedQuest({
          dungeonmasterHome: client.dungeonmasterHome,
          guildId: GUILD_ID,
          questFolder,
          quest,
        });

        const request = JsonRpcRequestStub({
          id: RpcIdStub({ value: 6003 }),
          method: RpcMethodStub({ value: 'tools/call' }),
          params: {
            name: 'modify-quest',
            arguments: { questId, title: 'New Title' },
          },
        });

        const response = await client.sendRequest(request);
        const persisted = QuestStub(
          mcp.readQuestFile({
            dungeonmasterHome: client.dungeonmasterHome,
            guildId: GUILD_ID,
            questFolder,
          }) as never,
        );

        expect(response.error).toBe(undefined);
        expect({ title: persisted.title, comments: persisted.comments }).toStrictEqual({
          title: 'New Title',
          comments: [orphanComment],
        });
      });

      it('VALID: {modify-quest flows write deleting a node} => the comment anchored to that node is dropped while a sibling node comment in the same flow survives untouched', async () => {
        const questId = 'mcp-node-delete';
        const questFolder = '001-mcp-node-delete';
        const startNode = FlowNodeStub({ id: 'start' as never, label: 'Start' as never });
        const submitNode = FlowNodeStub({
          id: 'submit-form' as never,
          label: 'Submit Form' as never,
        });
        const flow = FlowStub({
          id: 'login-flow' as never,
          nodes: [startNode, submitNode],
          edges: [],
        });
        const deletedComment = QuestCommentStub({
          id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d401' as never,
          flowId: 'login-flow' as never,
          nodeId: 'start' as never,
          text: 'Comment on the node about to be deleted' as never,
        });
        const siblingComment = QuestCommentStub({
          id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d402' as never,
          flowId: 'login-flow' as never,
          nodeId: 'submit-form' as never,
          text: 'Comment on the sibling node that survives' as never,
        });
        const quest = QuestStub({
          id: questId as never,
          folder: questFolder as never,
          status: 'flows_approved' as never,
          flows: [flow],
          comments: [deletedComment, siblingComment],
        });

        mcp.seedQuest({
          dungeonmasterHome: client.dungeonmasterHome,
          guildId: GUILD_ID,
          questFolder,
          quest,
        });

        const request = JsonRpcRequestStub({
          id: RpcIdStub({ value: 6004 }),
          method: RpcMethodStub({ value: 'tools/call' }),
          params: {
            name: 'modify-quest',
            arguments: {
              questId,
              flows: [{ id: 'login-flow', nodes: [{ id: 'start', _delete: true }] }],
            },
          },
        });

        const response = await client.sendRequest(request);
        const persisted = QuestStub(
          mcp.readQuestFile({
            dungeonmasterHome: client.dungeonmasterHome,
            guildId: GUILD_ID,
            questFolder,
          }) as never,
        );

        expect(response.error).toBe(undefined);
        expect(persisted.comments).toStrictEqual([siblingComment]);
      });

      it('VALID: {modify-quest flows write deleting one observable} => the observable-anchored comment is dropped while the node-anchored comment on the same node survives', async () => {
        const questId = 'mcp-observable-delete';
        const questFolder = '001-mcp-observable-delete';
        const node = FlowNodeStub({
          id: 'submit-form' as never,
          label: 'Submit Form' as never,
          observables: [FlowObservableStub({ id: 'obs-one' as never })],
        });
        const flow = FlowStub({ id: 'login-flow' as never, nodes: [node], edges: [] });
        const observableComment = QuestCommentStub({
          id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d501' as never,
          flowId: 'login-flow' as never,
          nodeId: 'submit-form' as never,
          observableId: 'obs-one' as never,
          text: 'Comment on the observable about to be deleted' as never,
        });
        const nodeComment = QuestCommentStub({
          id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d502' as never,
          flowId: 'login-flow' as never,
          nodeId: 'submit-form' as never,
          text: 'Plain node comment on the same node' as never,
        });
        const quest = QuestStub({
          id: questId as never,
          folder: questFolder as never,
          status: 'flows_approved' as never,
          flows: [flow],
          comments: [observableComment, nodeComment],
        });

        mcp.seedQuest({
          dungeonmasterHome: client.dungeonmasterHome,
          guildId: GUILD_ID,
          questFolder,
          quest,
        });

        const request = JsonRpcRequestStub({
          id: RpcIdStub({ value: 6005 }),
          method: RpcMethodStub({ value: 'tools/call' }),
          params: {
            name: 'modify-quest',
            arguments: {
              questId,
              flows: [
                {
                  id: 'login-flow',
                  nodes: [{ id: 'submit-form', observables: [{ id: 'obs-one', _delete: true }] }],
                },
              ],
            },
          },
        });

        const response = await client.sendRequest(request);
        const persisted = QuestStub(
          mcp.readQuestFile({
            dungeonmasterHome: client.dungeonmasterHome,
            guildId: GUILD_ID,
            questFolder,
          }) as never,
        );

        expect(response.error).toBe(undefined);
        expect(persisted.comments).toStrictEqual([nodeComment]);
      });

      it('VALID: {modify-quest flows write deleting a whole flow} => every comment on that flow is dropped, the surviving flow keeps its comments, and both the flow deletion and the comment cleanup land in the ONE persisted write', async () => {
        const questId = 'mcp-flow-delete';
        const questFolder = '001-mcp-flow-delete';
        const flowA = FlowStub({
          id: 'flow-a' as never,
          nodes: [FlowNodeStub({ id: 'node-a' as never, label: 'Node A' as never })],
          edges: [],
        });
        const flowB = FlowStub({
          id: 'flow-b' as never,
          name: 'Second Flow' as never,
          nodes: [FlowNodeStub({ id: 'node-b' as never, label: 'Node B' as never })],
          edges: [],
        });
        const commentA = QuestCommentStub({
          id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d601' as never,
          flowId: 'flow-a' as never,
          nodeId: 'node-a' as never,
          text: 'Comment on the flow about to be deleted' as never,
        });
        const commentB = QuestCommentStub({
          id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d602' as never,
          flowId: 'flow-b' as never,
          nodeId: 'node-b' as never,
          text: 'Comment on the surviving flow' as never,
        });
        const quest = QuestStub({
          id: questId as never,
          folder: questFolder as never,
          status: 'flows_approved' as never,
          flows: [flowA, flowB],
          comments: [commentA, commentB],
        });

        mcp.seedQuest({
          dungeonmasterHome: client.dungeonmasterHome,
          guildId: GUILD_ID,
          questFolder,
          quest,
        });

        const request = JsonRpcRequestStub({
          id: RpcIdStub({ value: 6006 }),
          method: RpcMethodStub({ value: 'tools/call' }),
          params: {
            name: 'modify-quest',
            arguments: {
              questId,
              flows: [{ id: 'flow-a', _delete: true }],
            },
          },
        });

        const response = await client.sendRequest(request);
        const persisted = QuestStub(
          mcp.readQuestFile({
            dungeonmasterHome: client.dungeonmasterHome,
            guildId: GUILD_ID,
            questFolder,
          }) as never,
        );

        expect(response.error).toBe(undefined);
        // Both survive from the SAME persisted file: the flow deletion and the comment cleanup
        // it triggers were never two writes — proving cleanup runs inside the one write, before
        // persist, rather than as a later pass that could observe a half-cleaned state on disk.
        expect({
          flowIds: persisted.flows.map((f) => f.id),
          comments: persisted.comments,
        }).toStrictEqual({ flowIds: ['flow-b'], comments: [commentB] });
      });

      it('VALID: {modify-quest flows write renaming a node label} => the comment anchored to that node survives with byte-identical text and createdAt', async () => {
        const questId = 'mcp-label-rename';
        const questFolder = '001-mcp-label-rename';
        const node = FlowNodeStub({ id: 'start' as never, label: 'Start' as never });
        const flow = FlowStub({ id: 'login-flow' as never, nodes: [node], edges: [] });
        const comment = QuestCommentStub({
          id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d701' as never,
          flowId: 'login-flow' as never,
          nodeId: 'start' as never,
          text: 'Comment anchored through a label rename' as never,
          createdAt: '2024-02-01T09:30:00.000Z' as never,
        });
        const quest = QuestStub({
          id: questId as never,
          folder: questFolder as never,
          status: 'flows_approved' as never,
          flows: [flow],
          comments: [comment],
        });

        mcp.seedQuest({
          dungeonmasterHome: client.dungeonmasterHome,
          guildId: GUILD_ID,
          questFolder,
          quest,
        });

        const request = JsonRpcRequestStub({
          id: RpcIdStub({ value: 6007 }),
          method: RpcMethodStub({ value: 'tools/call' }),
          params: {
            name: 'modify-quest',
            arguments: {
              questId,
              flows: [{ id: 'login-flow', nodes: [{ id: 'start', label: 'Renamed Start' }] }],
            },
          },
        });

        const response = await client.sendRequest(request);
        const persisted = QuestStub(
          mcp.readQuestFile({
            dungeonmasterHome: client.dungeonmasterHome,
            guildId: GUILD_ID,
            questFolder,
          }) as never,
        );

        expect(response.error).toBe(undefined);
        expect(persisted.comments).toStrictEqual([comment]);
      });
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
      expect(result.content[0]?.text).toMatch(/^# brokers\/ Folder Type$/mu);
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
      expect(result.content[0]?.text).toMatch(/^# Universal Syntax Rules$/mu);
    });
  });

  describe('content size cap', () => {
    // Tools whose response is NOT bounded by the 50KB cap. When a new tool is
    // added to mcpToolsStatics.tools.names it is automatically size-checked,
    // so this test will fail until the new tool either fits the cap with empty
    // args or is added here with a documented reason.
    const TOOLS_EXEMPT_FROM_SIZE_CAP = [
      // Require args — cannot be invoked with `{}`
      'discover',
      'get-folder-detail',
      'get-project-inventory',
      'get-project-map',
      'get-quest',
      'get-quest-status',
      'get-quest-planning-notes',
      'get-qa-checklist',
      'get-agent-prompt',
      'run-ward',
      'ask-user-question',
      // Mutating actions, not reference content
      'modify-quest',
      'start-quest',
      'signal-back',
      'create-quest',
      // Dynamic listings / state-driven returns whose size scales with user data
      'list-quests',
      'list-guilds',
      'get-next-step',
    ] as const;

    const sizeCappedTools = mcpToolsStatics.tools.names.filter(
      (name) => !TOOLS_EXEMPT_FROM_SIZE_CAP.some((exempt) => exempt === name),
    );

    it.each(sizeCappedTools)('VALID: tool %s => response content under 50KB', async (toolName) => {
      const request = JsonRpcRequestStub({
        id: RpcIdStub({ value: 99999 }),
        method: RpcMethodStub({ value: 'tools/call' }),
        params: {
          name: toolName,
          arguments: {},
        },
      });

      const response = await client.sendRequest(request);

      expect(response.error).toBe(undefined);

      const result = ToolCallResultStub(response.result as never);
      const [firstContent] = result.content;
      const text = String(firstContent!.text);

      expect(Buffer.byteLength(text, 'utf8')).toBeLessThanOrEqual(50_000);
    });
  });
});
