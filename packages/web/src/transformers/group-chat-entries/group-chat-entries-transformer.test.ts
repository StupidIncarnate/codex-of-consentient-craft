import {
  AssistantTextChatEntryStub,
  AssistantToolResultChatEntryStub,
  AssistantToolUseChatEntryStub,
  SystemErrorChatEntryStub,
  UserChatEntryStub,
} from '../../contracts/chat-entry/chat-entry.stub';
import { groupChatEntriesTransformer } from './group-chat-entries-transformer';

describe('groupChatEntriesTransformer', () => {
  describe('empty entries', () => {
    it('EMPTY: {entries: []} => returns empty array', () => {
      const result = groupChatEntriesTransformer({ entries: [] });

      expect(result).toStrictEqual([]);
    });
  });

  describe('non-tool entries', () => {
    it('VALID: {entries: [user]} => returns single group', () => {
      const entry = UserChatEntryStub();

      const result = groupChatEntriesTransformer({ entries: [entry] });

      expect(result).toStrictEqual([{ kind: 'single', entry }]);
    });

    it('VALID: {entries: [user, assistant text]} => returns two single groups', () => {
      const userEntry = UserChatEntryStub();
      const textEntry = AssistantTextChatEntryStub();

      const result = groupChatEntriesTransformer({ entries: [userEntry, textEntry] });

      expect(result).toStrictEqual([
        { kind: 'single', entry: userEntry },
        { kind: 'single', entry: textEntry },
      ]);
    });

    it('VALID: {entries: [system error]} => returns single group', () => {
      const entry = SystemErrorChatEntryStub();

      const result = groupChatEntriesTransformer({ entries: [entry] });

      expect(result).toStrictEqual([{ kind: 'single', entry }]);
    });
  });

  describe('tool grouping', () => {
    it('VALID: {entries: [tool_use]} => returns single tool group', () => {
      const toolUse = AssistantToolUseChatEntryStub();

      const result = groupChatEntriesTransformer({ entries: [toolUse] });

      expect(result).toStrictEqual([
        {
          kind: 'tool-group',
          entries: [toolUse],
          toolCount: 1,
          contextTokens: null,
          source: 'session',
        },
      ]);
    });

    it('VALID: {entries: [tool_use, tool_result]} => groups into one tool group', () => {
      const toolUse = AssistantToolUseChatEntryStub();
      const toolResult = AssistantToolResultChatEntryStub();

      const result = groupChatEntriesTransformer({ entries: [toolUse, toolResult] });

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

    it('VALID: {entries: [user, tool_use, tool_result, text]} => groups tools between singles', () => {
      const userEntry = UserChatEntryStub();
      const toolUse = AssistantToolUseChatEntryStub();
      const toolResult = AssistantToolResultChatEntryStub();
      const textEntry = AssistantTextChatEntryStub();

      const result = groupChatEntriesTransformer({
        entries: [userEntry, toolUse, toolResult, textEntry],
      });

      expect(result).toStrictEqual([
        { kind: 'single', entry: userEntry },
        {
          kind: 'tool-group',
          entries: [toolUse, toolResult],
          toolCount: 1,
          contextTokens: null,
          source: 'session',
        },
        { kind: 'single', entry: textEntry },
      ]);
    });
  });

  describe('source boundary', () => {
    it('VALID: {entries: [session tool, subagent tool]} => splits into two tool groups', () => {
      const sessionTool = AssistantToolUseChatEntryStub();
      const subagentTool = AssistantToolUseChatEntryStub({ source: 'subagent' });

      const result = groupChatEntriesTransformer({
        entries: [sessionTool, subagentTool],
      });

      expect(result).toStrictEqual([
        {
          kind: 'tool-group',
          entries: [sessionTool],
          toolCount: 1,
          contextTokens: null,
          source: 'session',
        },
        {
          kind: 'tool-group',
          entries: [subagentTool],
          toolCount: 1,
          contextTokens: null,
          source: 'subagent',
        },
      ]);
    });
  });

  describe('context tokens', () => {
    it('VALID: {entries: [tool_use with usage]} => computes context tokens from first tool_use', () => {
      const toolUse = AssistantToolUseChatEntryStub({
        usage: {
          inputTokens: 10000,
          outputTokens: 500,
          cacheCreationInputTokens: 2000,
          cacheReadInputTokens: 3000,
        },
      });

      const result = groupChatEntriesTransformer({ entries: [toolUse] });

      expect(result).toStrictEqual([
        {
          kind: 'tool-group',
          entries: [toolUse],
          toolCount: 1,
          contextTokens: 15000,
          source: 'session',
        },
      ]);
    });
  });
});
