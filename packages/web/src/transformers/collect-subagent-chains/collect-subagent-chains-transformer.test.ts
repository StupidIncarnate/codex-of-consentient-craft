import {
  AssistantTextChatEntryStub,
  AssistantToolResultChatEntryStub,
  AssistantToolUseChatEntryStub,
  TaskNotificationChatEntryStub,
  TaskToolUseChatEntryStub,
  UserChatEntryStub,
} from '@dungeonmaster/shared/contracts';
import { collectSubagentChainsTransformer } from './collect-subagent-chains-transformer';

describe('collectSubagentChainsTransformer', () => {
  describe('empty entries', () => {
    it('EMPTY: {entries: []} => returns empty array', () => {
      const result = collectSubagentChainsTransformer({ entries: [] });

      expect(result).toStrictEqual([]);
    });
  });

  describe('no subagent entries', () => {
    it('VALID: {entries with no agentId} => emits singles in order', () => {
      const userEntry = UserChatEntryStub();
      const textEntry = AssistantTextChatEntryStub();

      const result = collectSubagentChainsTransformer({ entries: [userEntry, textEntry] });

      expect(result).toStrictEqual([
        { kind: 'single', entry: userEntry },
        { kind: 'single', entry: textEntry },
      ]);
    });

    it('VALID: {tool_use + tool_result not in a sub-agent chain} => emitted as separate singles', () => {
      const toolUse = AssistantToolUseChatEntryStub({
        usage: {
          inputTokens: 20000,
          outputTokens: 100,
          cacheCreationInputTokens: 3000,
          cacheReadInputTokens: 2000,
        },
      });
      const toolResult = AssistantToolResultChatEntryStub();
      const nextText = AssistantTextChatEntryStub();

      const result = collectSubagentChainsTransformer({
        entries: [toolUse, toolResult, nextText],
      });

      expect(result).toStrictEqual([
        { kind: 'single', entry: toolUse },
        { kind: 'single', entry: toolResult },
        { kind: 'single', entry: nextText },
      ]);
    });
  });

  describe('subagent chain creation', () => {
    it('VALID: {Task tool_use + subagent entries + tool_result} => produces subagent-chain group', () => {
      const taskToolUse = TaskToolUseChatEntryStub({ agentId: 'agent-001' });
      const subagentToolUse = AssistantToolUseChatEntryStub({
        source: 'subagent',
        agentId: 'agent-001',
      });
      const subagentToolResult = AssistantToolResultChatEntryStub({
        source: 'subagent',
        agentId: 'agent-001',
      });
      const sessionToolResult = AssistantToolResultChatEntryStub({ agentId: 'agent-001' });

      const result = collectSubagentChainsTransformer({
        entries: [taskToolUse, subagentToolUse, subagentToolResult, sessionToolResult],
      });

      expect(result).toStrictEqual([
        {
          kind: 'subagent-chain',
          agentId: 'agent-001',
          description: 'Run tests',
          taskToolUse,
          innerGroups: [
            { kind: 'single', entry: subagentToolUse },
            { kind: 'single', entry: subagentToolResult },
          ],
          taskNotification: null,
          entryCount: 2,
          contextTokens: null,
        },
      ]);
    });

    it('VALID: {chain description extracted from toolInput JSON}', () => {
      const taskToolUse = TaskToolUseChatEntryStub({
        agentId: 'agent-001',
        toolInput: JSON.stringify({ description: 'Fix the linting errors', prompt: 'Fix lint' }),
      });
      const subagentEntry = AssistantTextChatEntryStub({
        source: 'subagent',
        agentId: 'agent-001',
      });

      const result = collectSubagentChainsTransformer({
        entries: [taskToolUse, subagentEntry],
      });

      expect(result).toStrictEqual([
        {
          kind: 'subagent-chain',
          agentId: 'agent-001',
          description: 'Fix the linting errors',
          taskToolUse,
          innerGroups: [{ kind: 'single', entry: subagentEntry }],
          taskNotification: null,
          entryCount: 1,
          contextTokens: null,
        },
      ]);
    });

    it('VALID: {subagent tool entries rendered flat as singles, not grouped}', () => {
      const taskToolUse = TaskToolUseChatEntryStub({ agentId: 'agent-001' });
      const subToolUse1 = AssistantToolUseChatEntryStub({
        source: 'subagent',
        agentId: 'agent-001',
        toolName: 'read_file',
      });
      const subToolResult1 = AssistantToolResultChatEntryStub({
        source: 'subagent',
        agentId: 'agent-001',
        toolName: 'read_file',
      });
      const subToolUse2 = AssistantToolUseChatEntryStub({
        source: 'subagent',
        agentId: 'agent-001',
        toolName: 'write_file',
      });
      const subToolResult2 = AssistantToolResultChatEntryStub({
        source: 'subagent',
        agentId: 'agent-001',
        toolName: 'write_file',
      });

      const result = collectSubagentChainsTransformer({
        entries: [taskToolUse, subToolUse1, subToolResult1, subToolUse2, subToolResult2],
      });

      expect(result).toStrictEqual([
        {
          kind: 'subagent-chain',
          agentId: 'agent-001',
          description: 'Run tests',
          taskToolUse,
          innerGroups: [
            { kind: 'single', entry: subToolUse1 },
            { kind: 'single', entry: subToolResult1 },
            { kind: 'single', entry: subToolUse2 },
            { kind: 'single', entry: subToolResult2 },
          ],
          taskNotification: null,
          entryCount: 4,
          contextTokens: null,
        },
      ]);
    });

    it.each([
      ['taskId (legacy path)', TaskNotificationChatEntryStub({ taskId: 'agent-001' })],
      [
        'agentId (converged path)',
        TaskNotificationChatEntryStub({ taskId: 'task-fallback', agentId: 'agent-001' }),
      ],
    ])(
      'VALID: {task_notification matched by %s} => included in chain',
      (_label, taskNotification) => {
        const taskToolUse = TaskToolUseChatEntryStub({ agentId: 'agent-001' });
        const subagentEntry = AssistantTextChatEntryStub({
          source: 'subagent',
          agentId: 'agent-001',
        });

        const result = collectSubagentChainsTransformer({
          entries: [taskToolUse, subagentEntry, taskNotification],
        });

        expect(result).toStrictEqual([
          {
            kind: 'subagent-chain',
            agentId: 'agent-001',
            description: 'Run tests',
            taskToolUse,
            innerGroups: [{ kind: 'single', entry: subagentEntry }],
            taskNotification,
            entryCount: 1,
            contextTokens: null,
          },
        ]);
      },
    );
  });

  describe('mixed entries', () => {
    it('VALID: {mixed session + subagent entries} => session entries stay flat, subagent entries in chain', () => {
      const userEntry = UserChatEntryStub();
      const taskToolUse = TaskToolUseChatEntryStub({ agentId: 'agent-001' });
      const subagentEntry = AssistantTextChatEntryStub({
        source: 'subagent',
        agentId: 'agent-001',
      });
      const textEntry = AssistantTextChatEntryStub();

      const result = collectSubagentChainsTransformer({
        entries: [userEntry, taskToolUse, subagentEntry, textEntry],
      });

      expect(result).toStrictEqual([
        { kind: 'single', entry: userEntry },
        {
          kind: 'subagent-chain',
          agentId: 'agent-001',
          description: 'Run tests',
          taskToolUse,
          innerGroups: [{ kind: 'single', entry: subagentEntry }],
          taskNotification: null,
          entryCount: 1,
          contextTokens: null,
        },
        { kind: 'single', entry: textEntry },
      ]);
    });

    it('VALID: {multiple sub-agent chains} => each produces separate subagent-chain group', () => {
      const taskToolUse1 = TaskToolUseChatEntryStub({ agentId: 'agent-001' });
      const subagentEntry1 = AssistantTextChatEntryStub({
        source: 'subagent',
        agentId: 'agent-001',
      });
      const taskToolUse2 = TaskToolUseChatEntryStub({ agentId: 'agent-002' });
      const subagentEntry2 = AssistantTextChatEntryStub({
        source: 'subagent',
        agentId: 'agent-002',
      });

      const result = collectSubagentChainsTransformer({
        entries: [taskToolUse1, subagentEntry1, taskToolUse2, subagentEntry2],
      });

      expect(result).toStrictEqual([
        {
          kind: 'subagent-chain',
          agentId: 'agent-001',
          description: 'Run tests',
          taskToolUse: taskToolUse1,
          innerGroups: [{ kind: 'single', entry: subagentEntry1 }],
          taskNotification: null,
          entryCount: 1,
          contextTokens: null,
        },
        {
          kind: 'subagent-chain',
          agentId: 'agent-002',
          description: 'Run tests',
          taskToolUse: taskToolUse2,
          innerGroups: [{ kind: 'single', entry: subagentEntry2 }],
          taskNotification: null,
          entryCount: 1,
          contextTokens: null,
        },
      ]);
    });
  });

  describe('subagent chain context delta', () => {
    it('VALID: {single subagent entry with usage} => contextTokens = 0 (first === last, no delta)', () => {
      const taskToolUse = TaskToolUseChatEntryStub({ agentId: 'agent-001' });
      const subEntry = AssistantToolUseChatEntryStub({
        source: 'subagent',
        agentId: 'agent-001',
        usage: {
          inputTokens: 10000,
          outputTokens: 100,
          cacheCreationInputTokens: 3000,
          cacheReadInputTokens: 2000,
        },
      });

      const result = collectSubagentChainsTransformer({
        entries: [taskToolUse, subEntry],
      });

      expect(result).toStrictEqual([
        {
          kind: 'subagent-chain',
          agentId: 'agent-001',
          description: 'Run tests',
          taskToolUse,
          innerGroups: [{ kind: 'single', entry: subEntry }],
          taskNotification: null,
          entryCount: 1,
          contextTokens: 0,
        },
      ]);
    });

    it('VALID: {subagent chain with usage on inner entries} => computes contextTokens delta', () => {
      const taskToolUse = TaskToolUseChatEntryStub({ agentId: 'agent-001' });
      const subEntry1 = AssistantToolUseChatEntryStub({
        source: 'subagent',
        agentId: 'agent-001',
        usage: {
          inputTokens: 10000,
          outputTokens: 100,
          cacheCreationInputTokens: 3000,
          cacheReadInputTokens: 2000,
        },
      });
      const subEntry2 = AssistantToolResultChatEntryStub({
        source: 'subagent',
        agentId: 'agent-001',
      });
      const subEntry3 = AssistantTextChatEntryStub({
        source: 'subagent',
        agentId: 'agent-001',
        usage: {
          inputTokens: 12000,
          outputTokens: 200,
          cacheCreationInputTokens: 3500,
          cacheReadInputTokens: 2400,
        },
      });

      const result = collectSubagentChainsTransformer({
        entries: [taskToolUse, subEntry1, subEntry2, subEntry3],
      });

      expect(result).toStrictEqual([
        {
          kind: 'subagent-chain',
          agentId: 'agent-001',
          description: 'Run tests',
          taskToolUse,
          innerGroups: [
            { kind: 'single', entry: subEntry1 },
            { kind: 'single', entry: subEntry2 },
            { kind: 'single', entry: subEntry3 },
          ],
          taskNotification: null,
          entryCount: 3,
          contextTokens: 2900,
        },
      ]);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {Task tool_use without matching subagent entries} => still creates chain with empty innerGroups', () => {
      const taskToolUse = TaskToolUseChatEntryStub({ agentId: 'agent-001' });

      const result = collectSubagentChainsTransformer({ entries: [taskToolUse] });

      expect(result).toStrictEqual([
        {
          kind: 'subagent-chain',
          agentId: 'agent-001',
          description: 'Run tests',
          taskToolUse,
          innerGroups: [],
          taskNotification: null,
          entryCount: 0,
          contextTokens: null,
        },
      ]);
    });

    it('EDGE: {Task tool_use without agentId} => still creates chain with empty agentId and empty innerGroups', () => {
      const taskToolUse = TaskToolUseChatEntryStub();

      const result = collectSubagentChainsTransformer({ entries: [taskToolUse] });

      expect(result).toStrictEqual([
        {
          kind: 'subagent-chain',
          agentId: '',
          description: 'Run tests',
          taskToolUse,
          innerGroups: [],
          taskNotification: null,
          entryCount: 0,
          contextTokens: null,
        },
      ]);
    });

    it('EDGE: {Agent tool_use without agentId} => still creates chain placeholder', () => {
      const agentToolUse = AssistantToolUseChatEntryStub({
        toolName: 'Agent',
        toolInput: JSON.stringify({ description: 'Explore codebase', prompt: 'find files' }),
      });

      const result = collectSubagentChainsTransformer({ entries: [agentToolUse] });

      expect(result).toStrictEqual([
        {
          kind: 'subagent-chain',
          agentId: '',
          description: 'Explore codebase',
          taskToolUse: agentToolUse,
          innerGroups: [],
          taskNotification: null,
          entryCount: 0,
          contextTokens: null,
        },
      ]);
    });

    it('EDGE: {subagent entries without matching Task tool_use} => emitted as flat singles', () => {
      const subagentToolUse = AssistantToolUseChatEntryStub({
        source: 'subagent',
        agentId: 'agent-001',
      });
      const subagentToolResult = AssistantToolResultChatEntryStub({
        source: 'subagent',
        agentId: 'agent-001',
      });

      const result = collectSubagentChainsTransformer({
        entries: [subagentToolUse, subagentToolResult],
      });

      expect(result).toStrictEqual([
        { kind: 'single', entry: subagentToolUse },
        { kind: 'single', entry: subagentToolResult },
      ]);
    });
  });

  describe('task completion tool_result pinning', () => {
    it.each([
      // post-convergence wire shape: tool_result created from a user tool_result content
      // item whose tool_use_id is the Task's toolUseId (stamped into `toolName` by
      // mapContentItemToChatEntryTransformer); outer line has parent_tool_use_id: null
      // so no agentId stamp happens.
      ['toolName match (fallback path)', { toolName: 'agent-001', content: 'Task completed' }],
      // streaming-source path: tool_result carried parent_tool_use_id and got stamped
      // with agentId = Task's toolUseId.
      ['agentId match (backward-compat path)', { agentId: 'agent-001', content: 'Task completed' }],
    ])(
      'VALID: {tool_result with %s} => pinned to chain (consumed, absent from innerGroups)',
      (_label, resultProps) => {
        const taskToolUse = TaskToolUseChatEntryStub({ agentId: 'agent-001' });
        const subagentEntry = AssistantTextChatEntryStub({
          source: 'subagent',
          agentId: 'agent-001',
        });

        const result = collectSubagentChainsTransformer({
          entries: [taskToolUse, subagentEntry, AssistantToolResultChatEntryStub(resultProps)],
        });

        expect(result).toStrictEqual([
          {
            kind: 'subagent-chain',
            agentId: 'agent-001',
            description: 'Run tests',
            taskToolUse,
            innerGroups: [{ kind: 'single', entry: subagentEntry }],
            taskNotification: null,
            entryCount: 1,
            contextTokens: null,
          },
        ]);
      },
    );

    it('EDGE: {tool_result with source: subagent and matching toolName but no agentId} => NOT pinned to chain', () => {
      const taskToolUse = TaskToolUseChatEntryStub({ agentId: 'agent-001' });
      const subagentTextEntry = AssistantTextChatEntryStub({
        source: 'subagent',
        agentId: 'agent-001',
      });
      // Some inner tool_result emitted from within the sub-agent's own execution,
      // not the Task completion. Even though its toolName matches the Task's
      // agentId, the `source: 'subagent'` check in the fallback must exclude it.
      // Lacks an agentId so indexSubagentEntriesTransformer won't pull it into
      // innerGroups either — proving the fallback does NOT absorb it.
      const innerSubagentToolResult = AssistantToolResultChatEntryStub({
        source: 'subagent',
        toolName: 'agent-001',
        content: 'inner result',
      });

      const result = collectSubagentChainsTransformer({
        entries: [taskToolUse, subagentTextEntry, innerSubagentToolResult],
      });

      // Chain contains only the properly-indexed subagent text entry. The inner
      // subagent tool_result was NOT pinned to the chain via the toolName fallback
      // and surfaces after the chain as a flat single.
      expect(result).toStrictEqual([
        {
          kind: 'subagent-chain',
          agentId: 'agent-001',
          description: 'Run tests',
          taskToolUse,
          innerGroups: [{ kind: 'single', entry: subagentTextEntry }],
          taskNotification: null,
          entryCount: 1,
          contextTokens: null,
        },
        { kind: 'single', entry: innerSubagentToolResult },
      ]);
    });

    it('EDGE: {tool_result with non-matching toolName and no agentId} => NOT pinned', () => {
      const taskToolUse = TaskToolUseChatEntryStub({ agentId: 'agent-001' });
      const subagentEntry = AssistantTextChatEntryStub({
        source: 'subagent',
        agentId: 'agent-001',
      });
      // An unrelated session tool_result (e.g., a Read tool result) following the
      // Task. Neither agentId nor toolName matches — must remain a flat single,
      // not absorbed into the chain.
      const unrelatedToolResult = AssistantToolResultChatEntryStub({
        toolName: 'read_file',
        content: 'file contents',
      });

      const result = collectSubagentChainsTransformer({
        entries: [taskToolUse, subagentEntry, unrelatedToolResult],
      });

      expect(result).toStrictEqual([
        {
          kind: 'subagent-chain',
          agentId: 'agent-001',
          description: 'Run tests',
          taskToolUse,
          innerGroups: [{ kind: 'single', entry: subagentEntry }],
          taskNotification: null,
          entryCount: 1,
          contextTokens: null,
        },
        { kind: 'single', entry: unrelatedToolResult },
      ]);
    });
  });

  describe('ordering within chain', () => {
    it('VALID: {sub-agent entries in a specific order} => chain preserves input ordering', () => {
      const taskToolUse = TaskToolUseChatEntryStub({ agentId: 'agent-001' });
      const first = AssistantTextChatEntryStub({
        source: 'subagent',
        agentId: 'agent-001',
        content: 'first',
      });
      const second = AssistantToolUseChatEntryStub({
        source: 'subagent',
        agentId: 'agent-001',
        toolName: 'read_file',
      });
      const third = AssistantToolResultChatEntryStub({
        source: 'subagent',
        agentId: 'agent-001',
        toolName: 'read_file',
      });
      const fourth = AssistantTextChatEntryStub({
        source: 'subagent',
        agentId: 'agent-001',
        content: 'final',
      });

      const result = collectSubagentChainsTransformer({
        entries: [taskToolUse, first, second, third, fourth],
      });

      expect(result).toStrictEqual([
        {
          kind: 'subagent-chain',
          agentId: 'agent-001',
          description: 'Run tests',
          taskToolUse,
          innerGroups: [
            { kind: 'single', entry: first },
            { kind: 'single', entry: second },
            { kind: 'single', entry: third },
            { kind: 'single', entry: fourth },
          ],
          taskNotification: null,
          entryCount: 4,
          contextTokens: null,
        },
      ]);
    });
  });

  describe('nested sub-agent chains', () => {
    it('VALID: {taskA + 2 singles A + taskB(parent:agent-a) + 1 single B} => chainB nested under chainA, not at top level', () => {
      const taskA = TaskToolUseChatEntryStub({ agentId: 'agent-a' });
      const singleA1 = AssistantTextChatEntryStub({
        source: 'subagent',
        agentId: 'agent-a',
        content: 'a1',
      });
      const singleA2 = AssistantTextChatEntryStub({
        source: 'subagent',
        agentId: 'agent-a',
        content: 'a2',
      });
      const taskB = TaskToolUseChatEntryStub({
        agentId: 'agent-b',
        parentAgentId: 'agent-a',
        source: 'subagent',
      });
      const singleB1 = AssistantTextChatEntryStub({
        source: 'subagent',
        agentId: 'agent-b',
        content: 'b1',
      });

      const result = collectSubagentChainsTransformer({
        entries: [taskA, singleA1, singleA2, taskB, singleB1],
      });

      expect(result).toStrictEqual([
        {
          kind: 'subagent-chain',
          agentId: 'agent-a',
          description: 'Run tests',
          taskToolUse: taskA,
          innerGroups: [
            { kind: 'single', entry: singleA1 },
            { kind: 'single', entry: singleA2 },
            {
              kind: 'subagent-chain',
              agentId: 'agent-b',
              description: 'Run tests',
              taskToolUse: taskB,
              innerGroups: [{ kind: 'single', entry: singleB1 }],
              taskNotification: null,
              entryCount: 1,
              contextTokens: null,
            },
          ],
          taskNotification: null,
          entryCount: 2,
          contextTokens: null,
        },
      ]);
    });

    it('EDGE: {taskB(parent:agent-missing) with no agent-missing chain} => chainB falls back to top level', () => {
      const taskB = TaskToolUseChatEntryStub({
        agentId: 'agent-b',
        parentAgentId: 'agent-missing',
        source: 'subagent',
      });

      const result = collectSubagentChainsTransformer({ entries: [taskB] });

      expect(result).toStrictEqual([
        {
          kind: 'subagent-chain',
          agentId: 'agent-b',
          description: 'Run tests',
          taskToolUse: taskB,
          innerGroups: [],
          taskNotification: null,
          entryCount: 0,
          contextTokens: null,
        },
      ]);
    });

    it('VALID: {two independent chains without parentAgentId} => both at top level in original order', () => {
      const taskA = TaskToolUseChatEntryStub({ agentId: 'agent-a' });
      const singleA = AssistantTextChatEntryStub({ source: 'subagent', agentId: 'agent-a' });
      const taskB = TaskToolUseChatEntryStub({ agentId: 'agent-b' });
      const singleB = AssistantTextChatEntryStub({ source: 'subagent', agentId: 'agent-b' });

      const result = collectSubagentChainsTransformer({
        entries: [taskA, singleA, taskB, singleB],
      });

      expect(result).toStrictEqual([
        {
          kind: 'subagent-chain',
          agentId: 'agent-a',
          description: 'Run tests',
          taskToolUse: taskA,
          innerGroups: [{ kind: 'single', entry: singleA }],
          taskNotification: null,
          entryCount: 1,
          contextTokens: null,
        },
        {
          kind: 'subagent-chain',
          agentId: 'agent-b',
          description: 'Run tests',
          taskToolUse: taskB,
          innerGroups: [{ kind: 'single', entry: singleB }],
          taskNotification: null,
          entryCount: 1,
          contextTokens: null,
        },
      ]);
    });

    it('VALID: {chainA 2 usage singles + nested chainB} => chainA.contextTokens=2900 from singles only, nested chainB excluded from delta', () => {
      const taskA = TaskToolUseChatEntryStub({ agentId: 'agent-a' });
      const subEntry1 = AssistantToolUseChatEntryStub({
        source: 'subagent',
        agentId: 'agent-a',
        usage: {
          inputTokens: 10000,
          outputTokens: 100,
          cacheCreationInputTokens: 3000,
          cacheReadInputTokens: 2000,
        },
      });
      const subEntry2 = AssistantTextChatEntryStub({
        source: 'subagent',
        agentId: 'agent-a',
        usage: {
          inputTokens: 12000,
          outputTokens: 200,
          cacheCreationInputTokens: 3500,
          cacheReadInputTokens: 2400,
        },
      });
      const taskB = TaskToolUseChatEntryStub({
        agentId: 'agent-b',
        parentAgentId: 'agent-a',
        source: 'subagent',
      });

      const result = collectSubagentChainsTransformer({
        entries: [taskA, subEntry1, subEntry2, taskB],
      });

      expect(result).toStrictEqual([
        {
          kind: 'subagent-chain',
          agentId: 'agent-a',
          description: 'Run tests',
          taskToolUse: taskA,
          innerGroups: [
            { kind: 'single', entry: subEntry1 },
            { kind: 'single', entry: subEntry2 },
            {
              kind: 'subagent-chain',
              agentId: 'agent-b',
              description: 'Run tests',
              taskToolUse: taskB,
              innerGroups: [],
              taskNotification: null,
              entryCount: 0,
              contextTokens: null,
            },
          ],
          taskNotification: null,
          entryCount: 2,
          contextTokens: 2900,
        },
      ]);
    });

    it('EDGE: {taskB(parent:agent-a, source:subagent) as only B entry} => chainB.taskToolUse=taskB but taskB absent from chainB.innerGroups', () => {
      const taskA = TaskToolUseChatEntryStub({ agentId: 'agent-a' });
      const taskB = TaskToolUseChatEntryStub({
        agentId: 'agent-b',
        parentAgentId: 'agent-a',
        source: 'subagent',
      });

      const result = collectSubagentChainsTransformer({ entries: [taskA, taskB] });

      expect(result).toStrictEqual([
        {
          kind: 'subagent-chain',
          agentId: 'agent-a',
          description: 'Run tests',
          taskToolUse: taskA,
          innerGroups: [
            {
              kind: 'subagent-chain',
              agentId: 'agent-b',
              description: 'Run tests',
              taskToolUse: taskB,
              innerGroups: [],
              taskNotification: null,
              entryCount: 0,
              contextTokens: null,
            },
          ],
          taskNotification: null,
          entryCount: 0,
          contextTokens: null,
        },
      ]);
    });

    it('VALID: {taskA + taskB(parent:A) + taskC(parent:B)} => 3-level nesting A > B > C with no depth cap', () => {
      const taskA = TaskToolUseChatEntryStub({ agentId: 'agent-a' });
      const taskB = TaskToolUseChatEntryStub({
        agentId: 'agent-b',
        parentAgentId: 'agent-a',
        source: 'subagent',
      });
      const taskC = TaskToolUseChatEntryStub({
        agentId: 'agent-c',
        parentAgentId: 'agent-b',
        source: 'subagent',
      });

      const result = collectSubagentChainsTransformer({ entries: [taskA, taskB, taskC] });

      expect(result).toStrictEqual([
        {
          kind: 'subagent-chain',
          agentId: 'agent-a',
          description: 'Run tests',
          taskToolUse: taskA,
          innerGroups: [
            {
              kind: 'subagent-chain',
              agentId: 'agent-b',
              description: 'Run tests',
              taskToolUse: taskB,
              innerGroups: [
                {
                  kind: 'subagent-chain',
                  agentId: 'agent-c',
                  description: 'Run tests',
                  taskToolUse: taskC,
                  innerGroups: [],
                  taskNotification: null,
                  entryCount: 0,
                  contextTokens: null,
                },
              ],
              taskNotification: null,
              entryCount: 0,
              contextTokens: null,
            },
          ],
          taskNotification: null,
          entryCount: 0,
          contextTokens: null,
        },
      ]);
    });
  });
});
