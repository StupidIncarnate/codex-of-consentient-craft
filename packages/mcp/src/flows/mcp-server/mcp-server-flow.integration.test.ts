/**
 * Integration test for McpServerFlow - tests actual function via subprocess
 * No mocks - spawns real server and communicates via stdio
 *
 * OPTIMIZATION: Uses a single shared server process for all tests to avoid
 * repeated subprocess spawn + 2s startup delay per test (16 tests x 2s = 32s saved)
 */

import { DesignDecisionStub } from '@dungeonmaster/shared/contracts/design-decision/design-decision.stub';
import { FlowNodeStub } from '@dungeonmaster/shared/contracts/flow-node/flow-node.stub';
import { FlowObservableStub } from '@dungeonmaster/shared/contracts/flow-observable/flow-observable.stub';
import { FlowStub } from '@dungeonmaster/shared/contracts/flow/flow.stub';
import { OperationItemStub } from '@dungeonmaster/shared/contracts/operation-item/operation-item.stub';
import { QuestCommentStub } from '@dungeonmaster/shared/contracts/quest-comment/quest-comment.stub';
import { QuestContractEntryStub } from '@dungeonmaster/shared/contracts/quest-contract-entry/quest-contract-entry.stub';
import { QuestNoteStub } from '@dungeonmaster/shared/contracts/quest-note/quest-note.stub';
import { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
import { ToolingRequirementStub } from '@dungeonmaster/shared/contracts/tooling-requirement/tooling-requirement.stub';
import { mcpToolsStatics } from '@dungeonmaster/shared/statics';

import { JsonRpcRequestStub } from '../../contracts/json-rpc-request/json-rpc-request.stub';
import { RpcIdStub } from '../../contracts/rpc-id/rpc-id.stub';
import { RpcMethodStub } from '../../contracts/rpc-method/rpc-method.stub';
import { ToolListResultStub } from '../../contracts/tool-list-result/tool-list-result.stub';
import { ToolCallResultStub } from '../../contracts/tool-call-result/tool-call-result.stub';
import { DiscoverTreeResultStub } from '../../contracts/discover-tree-result/discover-tree-result.stub';
import { GetQuestResultStub } from '@dungeonmaster/shared/contracts/get-quest-result/get-quest-result.stub';
import { ModifyQuestResultStub } from '@dungeonmaster/shared/contracts/modify-quest-result/modify-quest-result.stub';

import { mcpServerHarness } from '../../../test/harnesses/mcp-server/mcp-server.harness';
import { cwd } from '#gateway/node/process';
import { Buffer } from '#gateway/node/buffer';

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

    it('VALID: {tools/list} => no tool name starts with "siegelense-"', async () => {
      const request = mcp.buildToolListRequest();

      const response = await client.sendRequest(request);

      expect(response.error).toBe(undefined);

      const result = ToolListResultStub(response.result as never);

      const siegelenseToolNames = result.tools
        .map((tool) => tool.name)
        .filter((name) => name.startsWith('siegelense-'));

      expect(siegelenseToolNames).toStrictEqual([]);
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

    it('VALID: {glob: **/cwd-resolve-broker.*} => groups brokers from @dungeonmaster/shared', async () => {
      const request = JsonRpcRequestStub({
        id: RpcIdStub({ value: 5 }),
        method: RpcMethodStub({ value: 'tools/call' }),
        params: {
          name: 'discover',
          arguments: {
            glob: '**/cwd-resolve-broker.*',
          },
        },
      });

      const response = await client.sendRequest(request);

      expect(response.error).toBe(undefined);

      const result = ToolCallResultStub(response.result as never);
      const [firstContent] = result.content;

      const parsedData: unknown = JSON.parse(String(firstContent!.text));
      const data = DiscoverTreeResultStub(parsedData as never);

      expect(data.results).toMatch(/^@dungeonmaster\/\n {2}shared\/\n {4}brokers\/\n[\s\S]+$/u);
    });

    it('VALID: {glob: **/cwd-resolve-broker.*} => shared package includes cwd-resolve-broker', async () => {
      const request = JsonRpcRequestStub({
        id: RpcIdStub({ value: 6 }),
        method: RpcMethodStub({ value: 'tools/call' }),
        params: {
          name: 'discover',
          arguments: {
            glob: '**/cwd-resolve-broker.*',
          },
        },
      });

      const response = await client.sendRequest(request);

      expect(response.error).toBe(undefined);

      const result = ToolCallResultStub(response.result as never);
      const [firstContent] = result.content;

      const parsedData: unknown = JSON.parse(String(firstContent!.text));
      const data = DiscoverTreeResultStub(parsedData as never);

      expect(data.results).toMatch(/^ {10}cwd-resolve-broker \(broker\) - .+$/mu);
    });
  });

  describe('tools/call with params._meta present', () => {
    it('VALID: {name: get-architecture, params._meta: {claudecode/toolUseId}} => forwards meta to the handler without error', async () => {
      const request = JsonRpcRequestStub({
        id: RpcIdStub({ value: 8001 }),
        method: RpcMethodStub({ value: 'tools/call' }),
        params: {
          name: 'get-architecture',
          arguments: {},
          _meta: { 'claudecode/toolUseId': 'toolu_01test0000000000000000000' },
        },
      });

      const response = await client.sendRequest(request);

      expect(response.error).toBe(undefined);

      const result = ToolCallResultStub(response.result as never);

      expect(result.content[0]?.type).toBe('text');
      expect(result.content[0]?.text).toMatch(/^# Architecture Overview$/mu);
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
        id: questId,
        folder: questFolder,
        title: 'Storage Test Quest',
        status: 'created',
        userRequest: 'Testing storage consistency',
      });

      await mcp.seedQuest({
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
        id: questId,
        folder: questFolder,
        title: 'Modify Flow Quest',
        status: 'explore_flows',
        userRequest: 'Testing modify flow',
      });

      await mcp.seedQuest({
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
        id: questId,
        folder: questFolder,
        title: 'IsError Success Test',
        status: 'created',
        userRequest: 'Testing isError not set on success',
      });

      await mcp.seedQuest({
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
          id: 'submit-form',
          label: 'Submit Form',
          observables: [FlowObservableStub({ id: 'obs-one' })],
        });
        const loginFlow = FlowStub({
          id: 'login-flow',
          nodes: [FlowNodeStub({ id: 'start', label: 'Start' }), submitFormNode],
          edges: [],
        });
        const dashboardFlow = FlowStub({
          id: 'dashboard-flow',
          name: 'Dashboard Flow',
          entryPoint: '/dashboard',
          exitPoints: ['/dashboard/done'],
          nodes: [FlowNodeStub({ id: 'widget-panel', label: 'Widget Panel' })],
          edges: [],
        });
        const markupComment = QuestCommentStub({
          id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d101',
          flowId: 'login-flow',
          nodeId: 'start',
          text: '<b>bold claim</b> this box is wrong',
        });
        const newlineComment = QuestCommentStub({
          id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d102',
          flowId: 'login-flow',
          nodeId: 'submit-form',
          observableId: 'obs-one',
          text: 'First line of feedback\nSecond line of feedback',
        });
        const otherFlowComment = QuestCommentStub({
          id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d103',
          flowId: 'dashboard-flow',
          nodeId: 'widget-panel',
          text: 'Third distinct reviewer note on the dashboard',
        });
        const quest = QuestStub({
          id: questId,
          folder: questFolder,
          title: 'Comment Strip Fixture',
          status: 'flows_approved',
          userRequest: 'Testing comment strip on get-quest',
          flows: [loginFlow, dashboardFlow],
          comments: [markupComment, newlineComment, otherFlowComment],
        });

        await mcp.seedQuest({
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
          id: 'login-flow',
          nodes: [FlowNodeStub({ id: 'start', label: 'Start' })],
          edges: [],
        });
        const existingComment = QuestCommentStub({
          id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d201',
          flowId: 'login-flow',
          nodeId: 'start',
          text: 'Existing user comment',
        });
        // Hostile-shaped text (markup + embedded JSON + a newline): off-map hostile-input probe —
        // the strip is unconditional on the field, not a content-shaped filter, so it must block
        // this exactly as it blocks a benign string.
        const sneakyComment = QuestCommentStub({
          id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d202',
          flowId: 'login-flow',
          nodeId: 'start',
          text: '<script>{"inject":"me"}</script>\nAn agent should not be able to write this',
        });
        const quest = QuestStub({
          id: questId,
          folder: questFolder,
          status: 'flows_approved',
          flows: [flow],
          comments: [existingComment],
        });

        await mcp.seedQuest({
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

      // The strip deletes the whole `comments` key from the args object before modifyQuestInputContract
      // ever parses it — so a malformed (non-array) comments value never reaches validation at all. If
      // the strip instead ran AFTER validation (or not at all), this same payload would fail Zod's
      // array check inside questModifyBroker and the call would come back success: false. Getting
      // success: true here is the one assertion that distinguishes "stripped before validation" from
      // "stripped after" or "not stripped."
      it('VALID: {modify-quest comments: "not-an-array" from an agent} => the call still succeeds because the strip runs BEFORE validation, not after', async () => {
        const questId = 'mcp-malformed-comments';
        const questFolder = '001-mcp-malformed-comments';
        const flow = FlowStub({
          id: 'login-flow',
          nodes: [FlowNodeStub({ id: 'start', label: 'Start' })],
          edges: [],
        });
        const existingComment = QuestCommentStub({
          id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d901',
          flowId: 'login-flow',
          nodeId: 'start',
          text: 'Existing user comment',
        });
        const quest = QuestStub({
          id: questId,
          folder: questFolder,
          status: 'flows_approved',
          flows: [flow],
          comments: [existingComment],
        });

        await mcp.seedQuest({
          dungeonmasterHome: client.dungeonmasterHome,
          guildId: GUILD_ID,
          questFolder,
          quest,
        });

        const request = JsonRpcRequestStub({
          id: RpcIdStub({ value: 6008 }),
          method: RpcMethodStub({ value: 'tools/call' }),
          params: {
            name: 'modify-quest',
            arguments: { questId, comments: 'not-an-array' },
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

      // dd-no-orphan-validation-gate: the save-time invariant list carries no check that fails a
      // quest for an orphaned comment. orphanComment below is seeded pre-orphaned (nodeId
      // 'ghost-node' never existed in flows — not something cleanup dropped this write, since
      // this write never touches flows at all) so the save proceeds against a quest.json that
      // ALREADY holds the violation the DD forbids gating on. Parsing the tool response body for
      // an explicit `success: true` (not just the JSON-RPC transport-level absence of an error)
      // is the literal proof the DD asks for.
      it('VALID: {modify-quest title-only write on a quest already carrying an orphan comment} => comments stay byte-identical because no flows write means no anchor resolution runs, and the save-time invariants never gate on the orphan — the tool response body itself is success: true', async () => {
        const questId = 'mcp-title-only-orphan';
        const questFolder = '001-mcp-title-only-orphan';
        const flow = FlowStub({
          id: 'login-flow',
          nodes: [FlowNodeStub({ id: 'start', label: 'Start' })],
          edges: [],
        });
        const orphanComment = QuestCommentStub({
          id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d301',
          flowId: 'login-flow',
          nodeId: 'ghost-node',
          text: 'Anchored to a node that never existed in this write',
        });
        const quest = QuestStub({
          id: questId,
          folder: questFolder,
          // explore_flows, not flows_approved: 'title' is only in the per-status allowlist at
          // explore_flows (and a few earlier statuses) — flows_approved's allowlist omits it, so
          // a title-only write there is rejected outright rather than skipping cleanup.
          status: 'explore_flows',
          title: 'Old Title',
          flows: [flow],
          comments: [orphanComment],
        });

        await mcp.seedQuest({
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
        // The literal DD proof: the save succeeded (body-level success: true, no failedChecks)
        // even though quest.json still holds a comment whose anchor never resolves.
        expect(actual).toStrictEqual({ success: true });
        expect({ title: persisted.title, comments: persisted.comments }).toStrictEqual({
          title: 'New Title',
          comments: [orphanComment],
        });
      });

      it('VALID: {modify-quest flows write deleting a node} => the comment anchored to that node is dropped while a sibling node comment in the same flow survives untouched', async () => {
        const questId = 'mcp-node-delete';
        const questFolder = '001-mcp-node-delete';
        const startNode = FlowNodeStub({ id: 'start', label: 'Start' });
        const submitNode = FlowNodeStub({
          id: 'submit-form',
          label: 'Submit Form',
        });
        const flow = FlowStub({
          id: 'login-flow',
          nodes: [startNode, submitNode],
          edges: [],
        });
        const deletedComment = QuestCommentStub({
          id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d401',
          flowId: 'login-flow',
          nodeId: 'start',
          text: 'Comment on the node about to be deleted',
        });
        const siblingComment = QuestCommentStub({
          id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d402',
          flowId: 'login-flow',
          nodeId: 'submit-form',
          text: 'Comment on the sibling node that survives',
        });
        const quest = QuestStub({
          id: questId,
          folder: questFolder,
          status: 'flows_approved',
          flows: [flow],
          comments: [deletedComment, siblingComment],
        });

        await mcp.seedQuest({
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
          id: 'submit-form',
          label: 'Submit Form',
          observables: [FlowObservableStub({ id: 'obs-one' })],
        });
        const flow = FlowStub({ id: 'login-flow', nodes: [node], edges: [] });
        const observableComment = QuestCommentStub({
          id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d501',
          flowId: 'login-flow',
          nodeId: 'submit-form',
          observableId: 'obs-one',
          text: 'Comment on the observable about to be deleted',
        });
        const nodeComment = QuestCommentStub({
          id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d502',
          flowId: 'login-flow',
          nodeId: 'submit-form',
          text: 'Plain node comment on the same node',
        });
        const quest = QuestStub({
          id: questId,
          folder: questFolder,
          status: 'flows_approved',
          flows: [flow],
          comments: [observableComment, nodeComment],
        });

        await mcp.seedQuest({
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
          id: 'flow-a',
          nodes: [FlowNodeStub({ id: 'node-a', label: 'Node A' })],
          edges: [],
        });
        const flowB = FlowStub({
          id: 'flow-b',
          name: 'Second Flow',
          nodes: [FlowNodeStub({ id: 'node-b', label: 'Node B' })],
          edges: [],
        });
        const commentA = QuestCommentStub({
          id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d601',
          flowId: 'flow-a',
          nodeId: 'node-a',
          text: 'Comment on the flow about to be deleted',
        });
        const commentB = QuestCommentStub({
          id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d602',
          flowId: 'flow-b',
          nodeId: 'node-b',
          text: 'Comment on the surviving flow',
        });
        const quest = QuestStub({
          id: questId,
          folder: questFolder,
          status: 'flows_approved',
          flows: [flowA, flowB],
          comments: [commentA, commentB],
        });

        await mcp.seedQuest({
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
        const node = FlowNodeStub({ id: 'start', label: 'Start' });
        const flow = FlowStub({ id: 'login-flow', nodes: [node], edges: [] });
        const comment = QuestCommentStub({
          id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d701',
          flowId: 'login-flow',
          nodeId: 'start',
          text: 'Comment anchored through a label rename',
          createdAt: '2024-02-01T09:30:00.000Z',
        });
        const quest = QuestStub({
          id: questId,
          folder: questFolder,
          status: 'flows_approved',
          flows: [flow],
          comments: [comment],
        });

        await mcp.seedQuest({
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

    // Named list, not a hardcoded it.each array in isolation — every value questStageContract
    // currently accepts (spec/planning/implementation). Test files cannot import contracts (only
    // stubs), so this cannot be derived from questStageContract.options directly; the "omitted"
    // case (stage argument left off entirely) is covered by a separate standalone test per format
    // below rather than folded into this array, since it needs a differently-shaped arguments
    // object (no stage key at all, not merely an empty value).
    const GET_QUEST_STAGE_FILTERS = ['spec', 'planning', 'implementation'] as const;
    // Markup- and JSON-shaped, plus an embedded newline: a strip implemented by string surgery
    // (e.g. removing a `"comments":[...]` substring) rather than object-shape filtering would
    // still let this leak through, while the real strip (parsing through a narrower Zod shape) is
    // unaffected by the content's shape.
    const HOSTILE_COMMENT_TEXT =
      '<script>{"leak":"me"}</script>\nSENTINEL_HOSTILE_COMMENT_MUST_NEVER_REACH_AGENT';

    describe('check-get-quest-omits-comments + check-no-comment-text-reaches-agent — every stage x format', () => {
      it.each(GET_QUEST_STAGE_FILTERS)(
        'VALID: {format: json, stage: %s, quest with a hostile comment} => raw response has no comments key and never contains the hostile text',
        async (stage) => {
          const questId = `comment-matrix-json-${stage}`;
          const questFolder = `001-comment-matrix-json-${stage}`;
          const node = FlowNodeStub({ id: 'start', label: 'Start' });
          const flow = FlowStub({ id: 'login-flow', nodes: [node], edges: [] });
          const hostileComment = QuestCommentStub({
            id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d801',
            flowId: 'login-flow',
            nodeId: 'start',
            text: HOSTILE_COMMENT_TEXT,
          });
          const quest = QuestStub({
            id: questId,
            folder: questFolder,
            status: 'flows_approved',
            flows: [flow],
            comments: [hostileComment],
          });

          await mcp.seedQuest({
            dungeonmasterHome: client.dungeonmasterHome,
            guildId: GUILD_ID,
            questFolder,
            quest,
          });

          const request = JsonRpcRequestStub({
            id: RpcIdStub({ value: 7001 }),
            method: RpcMethodStub({ value: 'tools/call' }),
            params: {
              name: 'get-quest',
              arguments: { questId, format: 'json', stage },
            },
          });

          const response = await client.sendRequest(request);
          const result = ToolCallResultStub(response.result as never);
          const [content] = result.content;
          const rawText = String(content!.text);

          expect(response.error).toBe(undefined);
          expect(rawText.indexOf('"comments"')).toBe(-1);
          expect(rawText.indexOf(HOSTILE_COMMENT_TEXT)).toBe(-1);
        },
      );

      it('VALID: {format: json, stage omitted, quest with a hostile comment} => raw response has no comments key and never contains the hostile text', async () => {
        const questId = 'comment-matrix-json-omitted';
        const questFolder = '001-comment-matrix-json-omitted';
        const node = FlowNodeStub({ id: 'start', label: 'Start' });
        const flow = FlowStub({ id: 'login-flow', nodes: [node], edges: [] });
        const hostileComment = QuestCommentStub({
          id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d803',
          flowId: 'login-flow',
          nodeId: 'start',
          text: HOSTILE_COMMENT_TEXT,
        });
        const quest = QuestStub({
          id: questId,
          folder: questFolder,
          status: 'flows_approved',
          flows: [flow],
          comments: [hostileComment],
        });

        await mcp.seedQuest({
          dungeonmasterHome: client.dungeonmasterHome,
          guildId: GUILD_ID,
          questFolder,
          quest,
        });

        const request = JsonRpcRequestStub({
          id: RpcIdStub({ value: 7002 }),
          method: RpcMethodStub({ value: 'tools/call' }),
          params: {
            name: 'get-quest',
            arguments: { questId, format: 'json' },
          },
        });

        const response = await client.sendRequest(request);
        const result = ToolCallResultStub(response.result as never);
        const [content] = result.content;
        const rawText = String(content!.text);

        expect(response.error).toBe(undefined);
        expect(rawText.indexOf('"comments"')).toBe(-1);
        expect(rawText.indexOf(HOSTILE_COMMENT_TEXT)).toBe(-1);
      });

      it.each(GET_QUEST_STAGE_FILTERS)(
        'VALID: {format: text, stage: %s, quest with a hostile comment} => rendered text never contains the hostile comment text',
        async (stage) => {
          const questId = `comment-matrix-text-${stage}`;
          const questFolder = `001-comment-matrix-text-${stage}`;
          const node = FlowNodeStub({ id: 'start', label: 'Start' });
          const flow = FlowStub({ id: 'login-flow', nodes: [node], edges: [] });
          const hostileComment = QuestCommentStub({
            id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d804',
            flowId: 'login-flow',
            nodeId: 'start',
            text: HOSTILE_COMMENT_TEXT,
          });
          const quest = QuestStub({
            id: questId,
            folder: questFolder,
            status: 'flows_approved',
            flows: [flow],
            comments: [hostileComment],
          });

          await mcp.seedQuest({
            dungeonmasterHome: client.dungeonmasterHome,
            guildId: GUILD_ID,
            questFolder,
            quest,
          });

          const request = JsonRpcRequestStub({
            id: RpcIdStub({ value: 7101 }),
            method: RpcMethodStub({ value: 'tools/call' }),
            params: {
              name: 'get-quest',
              arguments: { questId, format: 'text', stage },
            },
          });

          const response = await client.sendRequest(request);
          const result = ToolCallResultStub(response.result as never);
          const [content] = result.content;
          const rawText = String(content!.text);

          expect(response.error).toBe(undefined);
          expect(rawText.indexOf(HOSTILE_COMMENT_TEXT)).toBe(-1);
        },
      );

      it('VALID: {format: text, stage omitted, quest with a hostile comment} => rendered text never contains the hostile comment text', async () => {
        const questId = 'comment-matrix-text-omitted';
        const questFolder = '001-comment-matrix-text-omitted';
        const node = FlowNodeStub({ id: 'start', label: 'Start' });
        const flow = FlowStub({ id: 'login-flow', nodes: [node], edges: [] });
        const hostileComment = QuestCommentStub({
          id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d805',
          flowId: 'login-flow',
          nodeId: 'start',
          text: HOSTILE_COMMENT_TEXT,
        });
        const quest = QuestStub({
          id: questId,
          folder: questFolder,
          status: 'flows_approved',
          flows: [flow],
          comments: [hostileComment],
        });

        await mcp.seedQuest({
          dungeonmasterHome: client.dungeonmasterHome,
          guildId: GUILD_ID,
          questFolder,
          quest,
        });

        const request = JsonRpcRequestStub({
          id: RpcIdStub({ value: 7102 }),
          method: RpcMethodStub({ value: 'tools/call' }),
          params: {
            name: 'get-quest',
            arguments: { questId, format: 'text' },
          },
        });

        const response = await client.sendRequest(request);
        const result = ToolCallResultStub(response.result as never);
        const [content] = result.content;
        const rawText = String(content!.text);

        expect(response.error).toBe(undefined);
        expect(rawText.indexOf(HOSTILE_COMMENT_TEXT)).toBe(-1);
      });
    });

    describe('check-agent-payload-otherwise-complete', () => {
      it('VALID: {format: json, quest with non-empty designDecisions/toolingRequirements/contracts/operations plus a comment} => every other section passes through unchanged and only comments is stripped', async () => {
        const questId = 'comment-strip-full-sections';
        const questFolder = '001-comment-strip-full-sections';
        // Every surviving section below deliberately carries the literal word "comments" inside
        // its OWN content (label/title/reason/name/text) — decoys. A strip that drops anything
        // whose content merely MENTIONS comments, rather than the schema-shaped `comments` key
        // (e.g. a naive string-scan strip), would collaterally eat these, and this test would
        // catch it. A fixture where nothing but the actual comment carries that word cannot tell
        // a schema-shaped strip apart from a content-shaped one.
        const node = FlowNodeStub({
          id: 'start',
          label: 'Where comments anchor',
        });
        const flow = FlowStub({ id: 'login-flow', nodes: [node], edges: [] });
        const designDecision = DesignDecisionStub({
          title: 'Track where comments anchor on the flow diagram',
          relatedNodeIds: ['start'],
        });
        const toolingRequirement = ToolingRequirementStub({
          reason: 'Renders inline comments in the flow diagram sidebar',
        });
        const contractEntry = QuestContractEntryStub({
          name: 'FlowComments',
          nodeId: 'start',
        });
        const operation = OperationItemStub({
          id: '00000000-0000-4000-8000-0000000000e1',
          role: 'codeweaver',
          text: 'build core: render the comments sidebar',
          status: 'pending',
          locked: false,
        });
        const comment = QuestCommentStub({
          id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d901',
          flowId: 'login-flow',
          nodeId: 'start',
          text: 'A comment among otherwise full sections',
        });
        const quest = QuestStub({
          id: questId,
          folder: questFolder,
          status: 'flows_approved',
          flows: [flow],
          designDecisions: [designDecision],
          toolingRequirements: [toolingRequirement],
          contracts: [contractEntry],
          operations: [operation],
          comments: [comment],
        });

        await mcp.seedQuest({
          dungeonmasterHome: client.dungeonmasterHome,
          guildId: GUILD_ID,
          questFolder,
          quest,
        });
        Reflect.deleteProperty(quest, 'comments');

        const request = JsonRpcRequestStub({
          id: RpcIdStub({ value: 7201 }),
          method: RpcMethodStub({ value: 'tools/call' }),
          params: {
            name: 'get-quest',
            arguments: { questId, format: 'json' },
          },
        });

        const response = await client.sendRequest(request);
        const result = ToolCallResultStub(response.result as never);
        const [content] = result.content;
        const actual: unknown = JSON.parse(String(content!.text));

        expect(response.error).toBe(undefined);
        // Exact match against a quest carrying REAL content in every other section (not the
        // empty-array defaults) — proves the strip costs the agent nothing beyond comments,
        // rather than vacuously passing because those sections were empty either way.
        expect(actual).toStrictEqual({ success: true, quest });
      });
    });

    // Off-map: concurrency. Two clients (here: two pipelined calls on the same MCP connection)
    // writing the SAME quest at once — one deletes a node (triggering comment cleanup), the other
    // renames the title. withQuestModifyLockLayerBroker serializes the critical section per
    // questId, so BOTH changes must land rather than one read-modify-write clobbering the other.
    describe('off-map: concurrency — parallel writes against the same quest serialize rather than race', () => {
      it('VALID: {two parallel modify-quest calls: node-delete and title-rename, same quest} => both changes land in the final persisted state', async () => {
        const questId = 'mcp-concurrent-writes';
        const questFolder = '001-mcp-concurrent-writes';
        const startNode = FlowNodeStub({ id: 'start', label: 'Start' });
        const keepNode = FlowNodeStub({ id: 'keep', label: 'Keep' });
        const flow = FlowStub({
          id: 'login-flow',
          nodes: [startNode, keepNode],
          edges: [],
        });
        const doomedComment = QuestCommentStub({
          id: 'c0e3e17a-58cc-4372-a567-0e02b2c3da01',
          flowId: 'login-flow',
          nodeId: 'start',
          text: 'Comment on the node the parallel delete removes',
        });
        const quest = QuestStub({
          id: questId,
          folder: questFolder,
          status: 'explore_flows',
          title: 'Original Title',
          flows: [flow],
          comments: [doomedComment],
        });

        await mcp.seedQuest({
          dungeonmasterHome: client.dungeonmasterHome,
          guildId: GUILD_ID,
          questFolder,
          quest,
        });

        const deleteRequest = JsonRpcRequestStub({
          id: RpcIdStub({ value: 7301 }),
          method: RpcMethodStub({ value: 'tools/call' }),
          params: {
            name: 'modify-quest',
            arguments: {
              questId,
              flows: [{ id: 'login-flow', nodes: [{ id: 'start', _delete: true }] }],
            },
          },
        });
        const titleRequest = JsonRpcRequestStub({
          id: RpcIdStub({ value: 7302 }),
          method: RpcMethodStub({ value: 'tools/call' }),
          params: {
            name: 'modify-quest',
            arguments: { questId, title: 'Retitled Under Race' },
          },
        });

        const [deleteResponse, titleResponse] = await Promise.all([
          client.sendRequest(deleteRequest),
          client.sendRequest(titleRequest),
        ]);

        const persisted = QuestStub(
          mcp.readQuestFile({
            dungeonmasterHome: client.dungeonmasterHome,
            guildId: GUILD_ID,
            questFolder,
          }) as never,
        );

        expect(deleteResponse.error).toBe(undefined);
        expect(titleResponse.error).toBe(undefined);
        expect({
          title: persisted.title,
          flowNodeIds: persisted.flows[0]!.nodes.map((flowNode) => flowNode.id),
          comments: persisted.comments,
        }).toStrictEqual({
          title: 'Retitled Under Race',
          flowNodeIds: ['keep'],
          comments: [],
        });
      });
    });

    // Off-map: re-entry. "Repeat the same action" — the second call targets a node already gone,
    // so this also proves the cleanup and the upsert delete are stable under a repeat rather than
    // erroring or resurrecting/duplicating the dropped comment.
    describe('off-map: re-entry — repeating the same node-delete write is a safe no-op the second time', () => {
      it('VALID: {same modify-quest node-delete request sent twice in sequence} => both calls succeed, comments stay clean, no corruption from the repeat', async () => {
        const questId = 'mcp-repeat-node-delete';
        const questFolder = '001-mcp-repeat-node-delete';
        const startNode = FlowNodeStub({ id: 'start', label: 'Start' });
        const flow = FlowStub({ id: 'login-flow', nodes: [startNode], edges: [] });
        const comment = QuestCommentStub({
          id: 'c0e3e17a-58cc-4372-a567-0e02b2c3da02',
          flowId: 'login-flow',
          nodeId: 'start',
          text: 'Comment on the node repeatedly deleted',
        });
        const quest = QuestStub({
          id: questId,
          folder: questFolder,
          status: 'flows_approved',
          flows: [flow],
          comments: [comment],
        });

        await mcp.seedQuest({
          dungeonmasterHome: client.dungeonmasterHome,
          guildId: GUILD_ID,
          questFolder,
          quest,
        });

        const firstRequest = JsonRpcRequestStub({
          id: RpcIdStub({ value: 7401 }),
          method: RpcMethodStub({ value: 'tools/call' }),
          params: {
            name: 'modify-quest',
            arguments: {
              questId,
              flows: [{ id: 'login-flow', nodes: [{ id: 'start', _delete: true }] }],
            },
          },
        });
        const firstResponse = await client.sendRequest(firstRequest);

        const secondRequest = JsonRpcRequestStub({
          id: RpcIdStub({ value: 7402 }),
          method: RpcMethodStub({ value: 'tools/call' }),
          params: {
            name: 'modify-quest',
            arguments: {
              questId,
              flows: [{ id: 'login-flow', nodes: [{ id: 'start', _delete: true }] }],
            },
          },
        });
        const secondResponse = await client.sendRequest(secondRequest);

        const persisted = QuestStub(
          mcp.readQuestFile({
            dungeonmasterHome: client.dungeonmasterHome,
            guildId: GUILD_ID,
            questFolder,
          }) as never,
        );

        expect(firstResponse.error).toBe(undefined);
        expect(secondResponse.error).toBe(undefined);
        expect({
          flowNodeIds: persisted.flows[0]!.nodes.map((flowNode) => flowNode.id),
          comments: persisted.comments,
        }).toStrictEqual({ flowNodeIds: [], comments: [] });
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

  // The pre-MCP-caller hook stamps `dungeonmasterCaller` onto every call's arguments. The server
  // runs in a temp testbed while this test runs inside the repo, so a caller cwd of process.cwd()
  // can only resolve to the repo root if the server really read it off the call.
  describe('tools/call carrying the pre-MCP-caller hook`s caller context', () => {
    const CALLER_SESSION_ID = '9c4d8f1c-3e38-48c9-bdec-22b61883b473';

    it('VALID: {strict-input tool, arguments carry dungeonmasterCaller} => the key is lifted off before the input contract parses', async () => {
      const request = JsonRpcRequestStub({
        id: RpcIdStub({ value: 4101 }),
        method: RpcMethodStub({ value: 'tools/call' }),
        params: {
          name: 'get-folder-detail',
          arguments: {
            folderType: 'brokers',
            dungeonmasterCaller: { cwd: cwd(), sessionId: CALLER_SESSION_ID },
          },
        },
      });

      const response = await client.sendRequest(request);

      expect(response.error).toBe(undefined);

      const result = ToolCallResultStub(response.result as never);

      expect(result.content[0]?.text).toMatch(/^# brokers\/ Folder Type$/mu);
    });

    it('VALID: {get-project-inventory, caller cwd inside the repo} => resolves the project root from the caller, not the server', async () => {
      const repoRoot = cwd().replace(/\/packages\/mcp$/u, '');
      const request = JsonRpcRequestStub({
        id: RpcIdStub({ value: 4102 }),
        method: RpcMethodStub({ value: 'tools/call' }),
        params: {
          name: 'get-project-inventory',
          arguments: {
            packageName: 'mcp',
            dungeonmasterCaller: { cwd: cwd(), sessionId: CALLER_SESSION_ID },
          },
        },
      });

      const response = await client.sendRequest(request);

      expect(response.error).toBe(undefined);

      const result = ToolCallResultStub(response.result as never);
      const [bannerLine] = String(result.content[0]?.text).split('\n');

      expect(bannerLine).toBe(
        `[project-root: ${repoRoot} — resolved from the caller's own working directory]`,
      );
    });
  });

  // Drives the REAL MCP boundary end-to-end for the summary: spawned server subprocess, real
  // orchestrator, real quest.json on disk. The layer responder and the renderer are unit-tested
  // against stubs, so this is the only place the registration, the dispatch Map entry, the
  // orchestrator's summary build and the render are proven wired to each other over a live quest.
  describe('tools/call with get-quest-summary', () => {
    const SUMMARY_GUILD_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
    const SUMMARY_WORK_ITEM_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

    it('VALID: {questId} => renders the coverage rows, the mid-quest observable, and the notes by kind', async () => {
      const questId = 'mcp-get-quest-summary';
      const questFolder = '001-mcp-get-quest-summary';
      const quest = QuestStub({
        id: questId,
        folder: questFolder,
        status: 'in_progress',
        flows: [
          FlowStub({
            id: 'login-flow',
            name: 'Login Flow',
            flowType: 'runtime',
            nodes: [
              FlowNodeStub({
                id: 'submit-credentials',
                label: 'Submit Credentials',
                observables: [
                  FlowObservableStub({
                    id: 'rejects-bleh-payload',
                    type: 'api-call',
                    description: 'POST /api/auth/login returns 400 for a non-JSON body',
                    addedBy: 'siegemaster',
                  }),
                ],
              }),
            ],
            edges: [],
          }),
        ],
        planningNotes: {
          blightLedger: [],
          questNotes: [
            QuestNoteStub({
              id: 'open-question-body-parser-owner',
              kind: 'open-question',
              role: 'siegemaster',
              workItemId: SUMMARY_WORK_ITEM_ID,
              flowId: 'login-flow',
              unitId: 'login-flow:observable:rejects-bleh-payload',
              summary: 'Who owns the body parser this route sits behind?',
              detail: 'The 400 comes from middleware, so the route never sees the request.',
              at: '2026-01-02T00:00:00.000Z',
            }),
          ],
          operationPlans: [],
        },
      });

      await mcp.seedQuest({
        dungeonmasterHome: client.dungeonmasterHome,
        guildId: SUMMARY_GUILD_ID,
        questFolder,
        quest,
      });

      const request = JsonRpcRequestStub({
        id: RpcIdStub({ value: 7601 }),
        method: RpcMethodStub({ value: 'tools/call' }),
        params: {
          name: 'get-quest-summary',
          arguments: { questId },
        },
      });

      const response = await client.sendRequest(request);
      const result = ToolCallResultStub(response.result as never);
      const lines = String(result.content[0]?.text).split('\n');

      expect({
        error: response.error,
        isError: result.isError,
        title: lines[0],
        flowHeading: lines.find((line) => line.startsWith('### `login-flow`')),
        observable: lines.find((line) => line.startsWith('- added by')),
        openQuestions: lines.find((line) => line.startsWith('### open-question')),
        walkResets: lines.find((line) => line.startsWith('### walk-reset')),
      }).toStrictEqual({
        error: undefined,
        isError: undefined,
        title: '# QUEST SUMMARY — `mcp-get-quest-summary`',
        flowHeading: '### `login-flow` "Login Flow" [runtime]',
        observable:
          '- added by siegemaster: `login-flow:observable:rejects-bleh-payload` [api-call]',
        openQuestions: '### open-question (1)',
        walkResets: '### walk-reset (0)',
      });
    });

    it('INVALID: {unknown questId} => returns the JSON error shape with isError', async () => {
      const request = JsonRpcRequestStub({
        id: RpcIdStub({ value: 7602 }),
        method: RpcMethodStub({ value: 'tools/call' }),
        params: {
          name: 'get-quest-summary',
          arguments: { questId: 'mcp-get-quest-summary-does-not-exist' },
        },
      });

      const response = await client.sendRequest(request);
      const result = ToolCallResultStub(response.result as never);

      expect(result.isError).toBe(true);
      expect(String(result.content[0]?.text)).toMatch(
        /^\{\n {2}"success": false,\n {2}"error": ".+"\n\}$/u,
      );
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
      'get-blight-checklist',
      'get-agent-prompt',
      'create-worktree',
      'ask-user-question',
      'get-quest-summary',
      'quest-work',
      'get-quest-work',
      // Mutating actions, not reference content
      'modify-quest',
      'start-quest',
      'signal-back',
      'create-quest',
      // Dynamic listings / state-driven returns whose size scales with user data
      'list-quests',
      'list-guilds',
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
