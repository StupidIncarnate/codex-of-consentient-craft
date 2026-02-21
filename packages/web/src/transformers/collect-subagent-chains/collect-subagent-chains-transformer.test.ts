import {
  AssistantTextChatEntryStub,
  AssistantToolResultChatEntryStub,
  AssistantToolUseChatEntryStub,
  TaskNotificationChatEntryStub,
  TaskToolUseChatEntryStub,
  UserChatEntryStub,
} from '../../contracts/chat-entry/chat-entry.stub';
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
            {
              kind: 'tool-group',
              entries: [subagentToolUse, subagentToolResult],
              toolCount: 1,
              contextTokens: null,
              source: 'subagent',
            },
          ],
          taskNotification: null,
          entryCount: 2,
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
        },
      ]);
    });

    it('VALID: {subagent entries grouped into innerGroups with nested tool-groups}', () => {
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
            {
              kind: 'tool-group',
              entries: [subToolUse1, subToolResult1, subToolUse2, subToolResult2],
              toolCount: 2,
              contextTokens: null,
              source: 'subagent',
            },
          ],
          taskNotification: null,
          entryCount: 4,
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
        },
        {
          kind: 'subagent-chain',
          agentId: 'agent-002',
          description: 'Run tests',
          taskToolUse: taskToolUse2,
          innerGroups: [{ kind: 'single', entry: subagentEntry2 }],
          taskNotification: null,
          entryCount: 1,
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
});
