import {
  AssistantTextChatEntryStub,
  AssistantToolResultChatEntryStub,
  AssistantToolUseChatEntryStub,
  UserChatEntryStub,
} from '../../contracts/chat-entry/chat-entry.stub';
import { mergeToolEntriesTransformer } from './merge-tool-entries-transformer';

describe('mergeToolEntriesTransformer', () => {
  describe('mixed entries', () => {
    it('VALID: {text, tool_use, tool_result, text} => merges tool pair, preserves text', () => {
      const text1 = AssistantTextChatEntryStub({ content: 'before' });
      const toolUse = AssistantToolUseChatEntryStub({
        toolUseId: 'use_1',
        toolName: 'Bash',
        toolInput: '{"command":"ls"}',
      });
      const toolResult = AssistantToolResultChatEntryStub({
        toolName: 'use_1',
        content: 'file.txt',
      });
      const text2 = AssistantTextChatEntryStub({ content: 'after' });

      const result = mergeToolEntriesTransformer({
        entries: [text1, toolUse, toolResult, text2],
      });

      expect(result).toStrictEqual([
        { kind: 'entry', entry: text1 },
        { kind: 'tool-pair', toolUse, toolResult },
        { kind: 'entry', entry: text2 },
      ]);
    });
  });

  describe('parallel tool calls', () => {
    it('VALID: {use1, use2, result2, result1} => pairs by ID, preserves use order', () => {
      const use1 = AssistantToolUseChatEntryStub({
        toolUseId: 'use_1',
        toolName: 'Bash',
        toolInput: '{"command":"ls"}',
      });
      const use2 = AssistantToolUseChatEntryStub({
        toolUseId: 'use_2',
        toolName: 'Read',
        toolInput: '{"path":"f.txt"}',
      });
      const result2 = AssistantToolResultChatEntryStub({ toolName: 'use_2', content: 'contents' });
      const result1 = AssistantToolResultChatEntryStub({ toolName: 'use_1', content: 'file.txt' });

      const result = mergeToolEntriesTransformer({
        entries: [use1, use2, result2, result1],
      });

      expect(result).toStrictEqual([
        { kind: 'tool-pair', toolUse: use1, toolResult: result1 },
        { kind: 'tool-pair', toolUse: use2, toolResult: result2 },
      ]);
    });
  });

  describe('unlinked entries', () => {
    it('VALID: {tool_use without id, tool_result} => no match, both render separately', () => {
      const toolUse = AssistantToolUseChatEntryStub({
        toolName: 'Bash',
        toolInput: '{"command":"ls"}',
      });
      const toolResult = AssistantToolResultChatEntryStub({
        toolName: 'orphan_id',
        content: 'output',
      });

      const result = mergeToolEntriesTransformer({ entries: [toolUse, toolResult] });

      expect(result).toStrictEqual([
        { kind: 'tool-pair', toolUse, toolResult: null },
        { kind: 'entry', entry: toolResult },
      ]);
    });
  });

  describe('user messages preserved', () => {
    it('VALID: {user, tool_use, tool_result} => user entry preserved', () => {
      const user = UserChatEntryStub({ content: 'hello' });
      const toolUse = AssistantToolUseChatEntryStub({
        toolUseId: 'use_1',
        toolName: 'Bash',
        toolInput: '{}',
      });
      const toolResult = AssistantToolResultChatEntryStub({
        toolName: 'use_1',
        content: 'done',
      });

      const result = mergeToolEntriesTransformer({ entries: [user, toolUse, toolResult] });

      expect(result).toStrictEqual([
        { kind: 'entry', entry: user },
        { kind: 'tool-pair', toolUse, toolResult },
      ]);
    });
  });

  describe('pending tool call', () => {
    it('VALID: {tool_use without result} => pair with null result', () => {
      const toolUse = AssistantToolUseChatEntryStub({
        toolUseId: 'use_1',
        toolName: 'Bash',
        toolInput: '{}',
      });

      const result = mergeToolEntriesTransformer({ entries: [toolUse] });

      expect(result).toStrictEqual([{ kind: 'tool-pair', toolUse, toolResult: null }]);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {entries: []} => returns empty array', () => {
      const result = mergeToolEntriesTransformer({ entries: [] });

      expect(result).toStrictEqual([]);
    });
  });
});
