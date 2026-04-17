import {
  AssistantToolResultChatEntryStub,
  AssistantToolUseChatEntryStub,
} from '@dungeonmaster/shared/contracts';
import { pairToolEntriesTransformer } from './pair-tool-entries-transformer';

describe('pairToolEntriesTransformer', () => {
  describe('sequential tool calls', () => {
    it('VALID: {tool_use then tool_result} => pairs them together', () => {
      const toolUse = AssistantToolUseChatEntryStub({
        toolUseId: 'use_1',
        toolName: 'Bash',
        toolInput: '{"command":"ls"}',
      });
      const toolResult = AssistantToolResultChatEntryStub({
        toolName: 'use_1',
        content: 'file.txt',
      });

      const result = pairToolEntriesTransformer({ entries: [toolUse, toolResult] });

      expect(result).toStrictEqual([{ toolUse, toolResult }]);
    });

    it('VALID: {two sequential pairs} => pairs each correctly', () => {
      const toolUse1 = AssistantToolUseChatEntryStub({
        toolUseId: 'use_1',
        toolName: 'Bash',
        toolInput: '{"command":"ls"}',
      });
      const toolResult1 = AssistantToolResultChatEntryStub({
        toolName: 'use_1',
        content: 'file.txt',
      });
      const toolUse2 = AssistantToolUseChatEntryStub({
        toolUseId: 'use_2',
        toolName: 'Read',
        toolInput: '{"path":"file.txt"}',
      });
      const toolResult2 = AssistantToolResultChatEntryStub({
        toolName: 'use_2',
        content: 'contents',
      });

      const result = pairToolEntriesTransformer({
        entries: [toolUse1, toolResult1, toolUse2, toolResult2],
      });

      expect(result).toStrictEqual([
        { toolUse: toolUse1, toolResult: toolResult1 },
        { toolUse: toolUse2, toolResult: toolResult2 },
      ]);
    });
  });

  describe('parallel tool calls', () => {
    it('VALID: {two tool_uses then two tool_results} => matches by ID', () => {
      const toolUse1 = AssistantToolUseChatEntryStub({
        toolUseId: 'use_1',
        toolName: 'Bash',
        toolInput: '{"command":"ls"}',
      });
      const toolUse2 = AssistantToolUseChatEntryStub({
        toolUseId: 'use_2',
        toolName: 'Read',
        toolInput: '{"path":"file.txt"}',
      });
      const toolResult2 = AssistantToolResultChatEntryStub({
        toolName: 'use_2',
        content: 'contents',
      });
      const toolResult1 = AssistantToolResultChatEntryStub({
        toolName: 'use_1',
        content: 'file.txt',
      });

      const result = pairToolEntriesTransformer({
        entries: [toolUse1, toolUse2, toolResult2, toolResult1],
      });

      expect(result).toStrictEqual([
        { toolUse: toolUse1, toolResult: toolResult1 },
        { toolUse: toolUse2, toolResult: toolResult2 },
      ]);
    });
  });

  describe('pending results', () => {
    it('VALID: {tool_use without result} => pairs with null result', () => {
      const toolUse = AssistantToolUseChatEntryStub({
        toolUseId: 'use_1',
        toolName: 'Bash',
        toolInput: '{"command":"ls"}',
      });

      const result = pairToolEntriesTransformer({ entries: [toolUse] });

      expect(result).toStrictEqual([{ toolUse, toolResult: null }]);
    });

    it('VALID: {tool_use without toolUseId} => pairs with null result', () => {
      const toolUse = AssistantToolUseChatEntryStub({
        toolName: 'Bash',
        toolInput: '{"command":"ls"}',
      });

      const result = pairToolEntriesTransformer({ entries: [toolUse] });

      expect(result).toStrictEqual([{ toolUse, toolResult: null }]);
    });
  });

  describe('orphan results', () => {
    it('VALID: {tool_result without matching tool_use} => adds as orphan pair', () => {
      const toolResult = AssistantToolResultChatEntryStub({
        toolName: 'orphan_id',
        content: 'orphan result',
      });

      const result = pairToolEntriesTransformer({ entries: [toolResult] });

      expect(result).toStrictEqual([{ toolUse: null, toolResult }]);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {entries: []} => returns empty array', () => {
      const result = pairToolEntriesTransformer({ entries: [] });

      expect(result).toStrictEqual([]);
    });
  });

  describe('mixed with non-tool entries', () => {
    it('VALID: {tool_use + tool_result only} => ignores other entry types', () => {
      const toolUse = AssistantToolUseChatEntryStub({
        toolUseId: 'use_1',
        toolName: 'Bash',
        toolInput: '{"command":"ls"}',
      });
      const toolResult = AssistantToolResultChatEntryStub({
        toolName: 'use_1',
        content: 'file.txt',
      });

      const result = pairToolEntriesTransformer({ entries: [toolUse, toolResult] });

      expect(result).toStrictEqual([{ toolUse, toolResult }]);
    });
  });
});
