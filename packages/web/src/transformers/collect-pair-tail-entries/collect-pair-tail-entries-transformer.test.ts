import {
  AssistantTextChatEntryStub,
  AssistantToolResultChatEntryStub,
  AssistantToolUseChatEntryStub,
} from '@dungeonmaster/shared/contracts';

import { collectPairTailEntriesTransformer } from './collect-pair-tail-entries-transformer';

describe('collectPairTailEntriesTransformer', () => {
  describe('empty input', () => {
    it('EMPTY: {entries: []} => returns empty Set', () => {
      const result = collectPairTailEntriesTransformer({ entries: [] });

      expect(result.size).toBe(0);
    });
  });

  describe('paired tool entries', () => {
    it('VALID: {tool_use with toolUseId, tool_result with matching toolName} => result entry is in set', () => {
      const toolUse = AssistantToolUseChatEntryStub({ toolUseId: 'use_1' });
      const toolResult = AssistantToolResultChatEntryStub({ toolName: 'use_1' });
      const entries = [toolUse, toolResult];

      const result = collectPairTailEntriesTransformer({ entries });

      expect(result.has(toolResult)).toBe(true);
      expect(result.size).toBe(1);
    });

    it('VALID: {two pairs} => both result entries are in set', () => {
      const toolUse1 = AssistantToolUseChatEntryStub({ toolUseId: 'use_1' });
      const toolResult1 = AssistantToolResultChatEntryStub({ toolName: 'use_1' });
      const toolUse2 = AssistantToolUseChatEntryStub({ toolUseId: 'use_2' });
      const toolResult2 = AssistantToolResultChatEntryStub({ toolName: 'use_2' });
      const entries = [toolUse1, toolResult1, toolUse2, toolResult2];

      const result = collectPairTailEntriesTransformer({ entries });

      expect(result.size).toBe(2);
      expect(result.has(toolResult1)).toBe(true);
      expect(result.has(toolResult2)).toBe(true);
    });
  });

  describe('orphan tool entries', () => {
    it('VALID: {tool_use without toolUseId, tool_result alone} => empty set', () => {
      const toolUse = AssistantToolUseChatEntryStub();
      const toolResult = AssistantToolResultChatEntryStub();

      const result = collectPairTailEntriesTransformer({ entries: [toolUse, toolResult] });

      expect(result.size).toBe(0);
    });

    it('VALID: {tool_use with id, tool_result with mismatching toolName} => empty set', () => {
      const toolUse = AssistantToolUseChatEntryStub({ toolUseId: 'use_1' });
      const toolResult = AssistantToolResultChatEntryStub({ toolName: 'use_other' });

      const result = collectPairTailEntriesTransformer({ entries: [toolUse, toolResult] });

      expect(result.size).toBe(0);
    });
  });

  describe('mixed entries', () => {
    it('VALID: {text, tool pair, text} => only paired result is in set', () => {
      const text1 = AssistantTextChatEntryStub();
      const toolUse = AssistantToolUseChatEntryStub({ toolUseId: 'use_1' });
      const toolResult = AssistantToolResultChatEntryStub({ toolName: 'use_1' });
      const text2 = AssistantTextChatEntryStub();

      const result = collectPairTailEntriesTransformer({
        entries: [text1, toolUse, toolResult, text2],
      });

      expect(result.size).toBe(1);
      expect(result.has(toolResult)).toBe(true);
    });
  });
});
