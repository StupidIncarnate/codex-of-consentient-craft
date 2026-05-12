import {
  AssistantTextChatEntryStub,
  AssistantThinkingChatEntryStub,
  AssistantToolResultChatEntryStub,
  AssistantToolUseChatEntryStub,
  UserChatEntryStub,
} from '@dungeonmaster/shared/contracts';

import {
  MergedEntryItemStub,
  MergedToolPairItemStub,
} from '../../contracts/merged-chat-item/merged-chat-item.stub';
import { computeMergedItemTailIndexTransformer } from './compute-merged-item-tail-index-transformer';

describe('computeMergedItemTailIndexTransformer', () => {
  describe('empty input', () => {
    it('EMPTY: {items: []} => returns 0', () => {
      const result = computeMergedItemTailIndexTransformer({ items: [] });

      expect(result).toBe(0);
    });
  });

  describe('no message anchor present', () => {
    it('VALID: {items: [tool-pair]} => returns 0 (last item index)', () => {
      const items = [MergedToolPairItemStub()];

      const result = computeMergedItemTailIndexTransformer({ items });

      expect(result).toBe(0);
    });

    it('VALID: {items: [tool-pair, tool-pair, tool-pair]} => returns 2 (last item index)', () => {
      const items = [MergedToolPairItemStub(), MergedToolPairItemStub(), MergedToolPairItemStub()];

      const result = computeMergedItemTailIndexTransformer({ items });

      expect(result).toBe(2);
    });

    it('VALID: {items: [thinking, tool-pair]} => returns 1 (thinking is not anchor, fallback to last)', () => {
      const items = [
        MergedEntryItemStub({ entry: AssistantThinkingChatEntryStub() }),
        MergedToolPairItemStub(),
      ];

      const result = computeMergedItemTailIndexTransformer({ items });

      expect(result).toBe(1);
    });

    it('VALID: {items: [orphan tool_use entry-kind]} => returns 0 (last item index)', () => {
      const items = [MergedEntryItemStub({ entry: AssistantToolUseChatEntryStub() })];

      const result = computeMergedItemTailIndexTransformer({ items });

      expect(result).toBe(0);
    });

    it('VALID: {items: [orphan tool_result entry-kind]} => returns 0 (last item index)', () => {
      const items = [MergedEntryItemStub({ entry: AssistantToolResultChatEntryStub() })];

      const result = computeMergedItemTailIndexTransformer({ items });

      expect(result).toBe(0);
    });
  });

  describe('message anchor present', () => {
    it('VALID: {items: [text]} => returns 0', () => {
      const items = [MergedEntryItemStub({ entry: AssistantTextChatEntryStub() })];

      const result = computeMergedItemTailIndexTransformer({ items });

      expect(result).toBe(0);
    });

    it('VALID: {items: [text, tool-pair, tool-pair]} => returns 0 (text is anchor)', () => {
      const items = [
        MergedEntryItemStub({ entry: AssistantTextChatEntryStub() }),
        MergedToolPairItemStub(),
        MergedToolPairItemStub(),
      ];

      const result = computeMergedItemTailIndexTransformer({ items });

      expect(result).toBe(0);
    });

    it('VALID: {items: [text, tool-pair, text, tool-pair]} => returns 2 (last text wins)', () => {
      const items = [
        MergedEntryItemStub({ entry: AssistantTextChatEntryStub({ content: 'first' }) }),
        MergedToolPairItemStub(),
        MergedEntryItemStub({ entry: AssistantTextChatEntryStub({ content: 'second' }) }),
        MergedToolPairItemStub(),
      ];

      const result = computeMergedItemTailIndexTransformer({ items });

      expect(result).toBe(2);
    });

    it('VALID: {items: [tool-pair, user, tool-pair]} => returns 1 (user prompt is anchor)', () => {
      const items = [
        MergedToolPairItemStub(),
        MergedEntryItemStub({ entry: UserChatEntryStub({ source: 'subagent' }) }),
        MergedToolPairItemStub(),
      ];

      const result = computeMergedItemTailIndexTransformer({ items });

      expect(result).toBe(1);
    });

    it('VALID: {items: [text, thinking, tool-pair]} => returns 0 (thinking does not displace text anchor)', () => {
      const items = [
        MergedEntryItemStub({ entry: AssistantTextChatEntryStub() }),
        MergedEntryItemStub({ entry: AssistantThinkingChatEntryStub() }),
        MergedToolPairItemStub(),
      ];

      const result = computeMergedItemTailIndexTransformer({ items });

      expect(result).toBe(0);
    });
  });
});
