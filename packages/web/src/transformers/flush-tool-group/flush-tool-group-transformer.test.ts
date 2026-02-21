import {
  AssistantToolResultChatEntryStub,
  AssistantToolUseChatEntryStub,
} from '../../contracts/chat-entry/chat-entry.stub';
import { flushToolGroupTransformer } from './flush-tool-group-transformer';

describe('flushToolGroupTransformer', () => {
  describe('basic grouping', () => {
    it('VALID: {group: [tool_use, tool_result]} => returns tool-group with toolCount 1', () => {
      const firstEntry = AssistantToolUseChatEntryStub();
      const group = [firstEntry, AssistantToolResultChatEntryStub()];

      const result = flushToolGroupTransformer({ group, firstEntry });

      expect(result).toStrictEqual({
        kind: 'tool-group',
        entries: group,
        toolCount: 1,
        contextTokens: null,
        source: 'session',
      });
    });

    it('VALID: {group: [tool_use, tool_use]} => returns toolCount 2', () => {
      const firstEntry = AssistantToolUseChatEntryStub();
      const group = [firstEntry, AssistantToolUseChatEntryStub({ toolName: 'write_file' })];

      const result = flushToolGroupTransformer({ group, firstEntry });

      expect(result).toStrictEqual({
        kind: 'tool-group',
        entries: group,
        toolCount: 2,
        contextTokens: null,
        source: 'session',
      });
    });
  });

  describe('context tokens', () => {
    it('VALID: {group with usage on first tool_use} => returns context tokens sum', () => {
      const firstEntry = AssistantToolUseChatEntryStub({
        usage: {
          inputTokens: 1000,
          outputTokens: 200,
          cacheCreationInputTokens: 500,
          cacheReadInputTokens: 300,
        },
      });
      const group = [firstEntry, AssistantToolResultChatEntryStub()];

      const result = flushToolGroupTransformer({ group, firstEntry });

      expect(result).toStrictEqual({
        kind: 'tool-group',
        entries: group,
        toolCount: 1,
        contextTokens: 1800,
        source: 'session',
      });
    });
  });

  describe('source resolution', () => {
    it('VALID: {group with subagent source} => returns subagent source', () => {
      const firstEntry = AssistantToolUseChatEntryStub({ source: 'subagent' });
      const group = [firstEntry, AssistantToolResultChatEntryStub({ source: 'subagent' })];

      const result = flushToolGroupTransformer({ group, firstEntry });

      expect(result).toStrictEqual({
        kind: 'tool-group',
        entries: group,
        toolCount: 1,
        contextTokens: null,
        source: 'subagent',
      });
    });
  });
});
