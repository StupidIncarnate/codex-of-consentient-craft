import {
  AssistantTextChatEntryStub,
  AssistantThinkingChatEntryStub,
  AssistantToolResultChatEntryStub,
  AssistantToolUseChatEntryStub,
  TaskToolUseChatEntryStub,
  UserChatEntryStub,
} from '@dungeonmaster/shared/contracts';

import { ToolNameStub } from '../../contracts/tool-name/tool-name.stub';
import { filterParentSourceEntriesTransformer } from './filter-parent-source-entries-transformer';
import { filterParentSourceEntriesTransformerProxy } from './filter-parent-source-entries-transformer.proxy';

type ToolName = ReturnType<typeof ToolNameStub>;

describe('filterParentSourceEntriesTransformer', () => {
  describe('parent-source (session) entries', () => {
    it('VALID: {session-source assistant text} => dropped', () => {
      filterParentSourceEntriesTransformerProxy();
      const taskToolUseIds = new Set<ToolName>();
      const entry = AssistantTextChatEntryStub({
        source: 'session',
        content: 'narrating my next step',
      });

      const result = filterParentSourceEntriesTransformer({
        entries: [entry],
        taskToolUseIds,
      });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {session-source Task tool_use} => forwarded and toolUseId recorded', () => {
      filterParentSourceEntriesTransformerProxy();
      const taskToolUseIds = new Set<ToolName>();
      const taskId = 'toolu_01TaskDispatch';
      const entry = TaskToolUseChatEntryStub({
        source: 'session',
        toolUseId: taskId,
      });

      const result = filterParentSourceEntriesTransformer({
        entries: [entry],
        taskToolUseIds,
      });

      expect(result).toStrictEqual([entry]);
      expect(taskToolUseIds.has(ToolNameStub({ value: taskId }))).toBe(true);
    });

    it('VALID: {session-source Agent tool_use (alias)} => forwarded and toolUseId recorded', () => {
      filterParentSourceEntriesTransformerProxy();
      const taskToolUseIds = new Set<ToolName>();
      const agentId = 'toolu_01AgentAlias';
      const entry = AssistantToolUseChatEntryStub({
        source: 'session',
        toolName: 'Agent',
        toolUseId: agentId,
      });

      const result = filterParentSourceEntriesTransformer({
        entries: [entry],
        taskToolUseIds,
      });

      expect(result).toStrictEqual([entry]);
      expect(taskToolUseIds.has(ToolNameStub({ value: agentId }))).toBe(true);
    });

    it('VALID: {session-source non-Task tool_use (get-next-step)} => dropped', () => {
      filterParentSourceEntriesTransformerProxy();
      const taskToolUseIds = new Set<ToolName>();
      const entry = AssistantToolUseChatEntryStub({
        source: 'session',
        toolName: 'mcp__dungeonmaster__get-next-step',
        toolUseId: 'toolu_01NextStep',
      });

      const result = filterParentSourceEntriesTransformer({
        entries: [entry],
        taskToolUseIds,
      });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {session-source tool_result for a previously-recorded Task toolUseId} => forwarded', () => {
      filterParentSourceEntriesTransformerProxy();
      const taskId = 'toolu_01TaskDispatch';
      const taskToolUseIds = new Set<ToolName>([ToolNameStub({ value: taskId })]);
      const entry = AssistantToolResultChatEntryStub({
        source: 'session',
        toolName: taskId,
        content: 'Task done',
      });

      const result = filterParentSourceEntriesTransformer({
        entries: [entry],
        taskToolUseIds,
      });

      expect(result).toStrictEqual([entry]);
    });

    it('VALID: {session-source tool_result for an unrecorded id (Read result)} => dropped', () => {
      filterParentSourceEntriesTransformerProxy();
      const taskToolUseIds = new Set<ToolName>();
      const entry = AssistantToolResultChatEntryStub({
        source: 'session',
        toolName: 'toolu_01ReadFile',
        content: 'file contents',
      });

      const result = filterParentSourceEntriesTransformer({
        entries: [entry],
        taskToolUseIds,
      });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {session-source thinking} => dropped', () => {
      filterParentSourceEntriesTransformerProxy();
      const taskToolUseIds = new Set<ToolName>();
      const entry = AssistantThinkingChatEntryStub({ source: 'session' });

      const result = filterParentSourceEntriesTransformer({
        entries: [entry],
        taskToolUseIds,
      });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {session-source user message} => dropped', () => {
      filterParentSourceEntriesTransformerProxy();
      const taskToolUseIds = new Set<ToolName>();
      const entry = UserChatEntryStub({ source: 'session' });

      const result = filterParentSourceEntriesTransformer({
        entries: [entry],
        taskToolUseIds,
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('sub-agent-source entries', () => {
    it('VALID: {subagent-source text} => forwarded', () => {
      filterParentSourceEntriesTransformerProxy();
      const taskToolUseIds = new Set<ToolName>();
      const entry = AssistantTextChatEntryStub({
        source: 'subagent',
        content: 'subagent narration',
      });

      const result = filterParentSourceEntriesTransformer({
        entries: [entry],
        taskToolUseIds,
      });

      expect(result).toStrictEqual([entry]);
    });

    it('VALID: {subagent-source non-Task tool_use} => forwarded', () => {
      filterParentSourceEntriesTransformerProxy();
      const taskToolUseIds = new Set<ToolName>();
      const entry = AssistantToolUseChatEntryStub({
        source: 'subagent',
        toolName: 'Read',
      });

      const result = filterParentSourceEntriesTransformer({
        entries: [entry],
        taskToolUseIds,
      });

      expect(result).toStrictEqual([entry]);
    });

    it('VALID: {subagent-source tool_result for an unrecorded id} => forwarded (subagent always passes)', () => {
      filterParentSourceEntriesTransformerProxy();
      const taskToolUseIds = new Set<ToolName>();
      const entry = AssistantToolResultChatEntryStub({
        source: 'subagent',
        toolName: 'toolu_01ReadFile',
        content: 'file contents',
      });

      const result = filterParentSourceEntriesTransformer({
        entries: [entry],
        taskToolUseIds,
      });

      expect(result).toStrictEqual([entry]);
    });
  });

  describe('mixed batch', () => {
    it('VALID: {mix of session+subagent} => only Task tool_use, its tool_result, and all subagent entries survive', () => {
      filterParentSourceEntriesTransformerProxy();
      const taskToolUseIds = new Set<ToolName>();
      const taskId = 'toolu_01MixedTask';

      const sessionText = AssistantTextChatEntryStub({ source: 'session', content: 'dispatch' });
      const taskUse = TaskToolUseChatEntryStub({ source: 'session', toolUseId: taskId });
      const otherUse = AssistantToolUseChatEntryStub({
        source: 'session',
        toolName: 'mcp__dungeonmaster__get-next-step',
        toolUseId: 'toolu_01Other',
      });
      const taskResult = AssistantToolResultChatEntryStub({
        source: 'session',
        toolName: taskId,
        content: 'done',
      });
      const subagentText = AssistantTextChatEntryStub({
        source: 'subagent',
        content: 'doing work',
      });

      const result = filterParentSourceEntriesTransformer({
        entries: [sessionText, taskUse, otherUse, taskResult, subagentText],
        taskToolUseIds,
      });

      expect(result).toStrictEqual([taskUse, taskResult, subagentText]);
    });
  });
});
