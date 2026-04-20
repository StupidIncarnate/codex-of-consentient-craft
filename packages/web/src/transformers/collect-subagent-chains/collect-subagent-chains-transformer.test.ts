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
    it('VALID: {entries with no agentId} => delegates to groupChatEntriesTransformer (no chains)', () => {
      const userEntry = UserChatEntryStub();
      const textEntry = AssistantTextChatEntryStub();

      const result = collectSubagentChainsTransformer({ entries: [userEntry, textEntry] });

      expect(result).toStrictEqual([
        { kind: 'single', entry: userEntry },
        { kind: 'single', entry: textEntry },
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

    it('VALID: {task_notification with matching taskId} => included in chain', () => {
      const taskToolUse = TaskToolUseChatEntryStub({ agentId: 'agent-001' });
      const subagentEntry = AssistantTextChatEntryStub({
        source: 'subagent',
        agentId: 'agent-001',
      });
      const taskNotification = TaskNotificationChatEntryStub({ taskId: 'agent-001' });

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
    });
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

  describe('context delta computation', () => {
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

    it('VALID: {tool-group followed by entry with usage} => computes contextTokens as delta', () => {
      const toolUse = AssistantToolUseChatEntryStub({
        usage: {
          inputTokens: 20000,
          outputTokens: 100,
          cacheCreationInputTokens: 3000,
          cacheReadInputTokens: 2000,
        },
      });
      const toolResult = AssistantToolResultChatEntryStub();
      const nextText = AssistantTextChatEntryStub({
        usage: {
          inputTokens: 20500,
          outputTokens: 200,
          cacheCreationInputTokens: 3000,
          cacheReadInputTokens: 2150,
        },
      });

      const result = collectSubagentChainsTransformer({
        entries: [toolUse, toolResult, nextText],
      });

      expect(result).toStrictEqual([
        {
          kind: 'tool-group',
          entries: [toolUse, toolResult],
          toolCount: 1,
          contextTokens: 650,
          source: 'session',
        },
        {
          kind: 'single',
          entry: nextText,
        },
      ]);
    });

    it('VALID: {tool-group with no subsequent usage entry} => contextTokens becomes null', () => {
      const toolUse = AssistantToolUseChatEntryStub({
        usage: {
          inputTokens: 20000,
          outputTokens: 100,
          cacheCreationInputTokens: 3000,
          cacheReadInputTokens: 2000,
        },
      });
      const toolResult = AssistantToolResultChatEntryStub();

      const result = collectSubagentChainsTransformer({
        entries: [toolUse, toolResult],
      });

      expect(result).toStrictEqual([
        {
          kind: 'tool-group',
          entries: [toolUse, toolResult],
          toolCount: 1,
          contextTokens: null,
          source: 'session',
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

    it('EDGE: {subagent entries without matching Task tool_use} => treated as normal flat entries', () => {
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
        {
          kind: 'tool-group',
          entries: [subagentToolUse, subagentToolResult],
          toolCount: 1,
          contextTokens: null,
          source: 'subagent',
        },
      ]);
    });
  });

  describe('task completion tool_result pinning', () => {
    it('VALID: {tool_result with toolName === Task.agentId and no agentId} => pinned to chain (fallback path)', () => {
      const taskToolUse = TaskToolUseChatEntryStub({ agentId: 'agent-001' });
      const subagentEntry = AssistantTextChatEntryStub({
        source: 'subagent',
        agentId: 'agent-001',
      });
      // Simulates the post-convergence wire shape: tool_result created from a user
      // tool_result content item whose tool_use_id is the Task's toolUseId (stamped
      // into `toolName` by mapContentItemToChatEntryTransformer), and whose outer line
      // has parent_tool_use_id: null so no agentId stamp happens.
      const taskCompletionToolResult = AssistantToolResultChatEntryStub({
        toolName: 'agent-001',
        content: 'Task completed',
      });

      const result = collectSubagentChainsTransformer({
        entries: [taskToolUse, subagentEntry, taskCompletionToolResult],
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
    });

    it('VALID: {tool_result with agentId === Task.agentId} => pinned to chain (backward-compat path)', () => {
      const taskToolUse = TaskToolUseChatEntryStub({ agentId: 'agent-001' });
      const subagentEntry = AssistantTextChatEntryStub({
        source: 'subagent',
        agentId: 'agent-001',
      });
      // Streaming-source path: the tool_result carried parent_tool_use_id and got
      // stamped with agentId = Task's toolUseId.
      const taskCompletionToolResult = AssistantToolResultChatEntryStub({
        agentId: 'agent-001',
        content: 'Task completed',
      });

      const result = collectSubagentChainsTransformer({
        entries: [taskToolUse, subagentEntry, taskCompletionToolResult],
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
    });

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
      // and surfaces after the chain (normal-buffer grouping wraps a trailing
      // tool_result as a tool-group with toolCount 0).
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
        {
          kind: 'tool-group',
          entries: [innerSubagentToolResult],
          toolCount: 0,
          contextTokens: null,
          source: 'subagent',
        },
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
        {
          kind: 'tool-group',
          entries: [unrelatedToolResult],
          toolCount: 0,
          contextTokens: null,
          source: 'session',
        },
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
});
