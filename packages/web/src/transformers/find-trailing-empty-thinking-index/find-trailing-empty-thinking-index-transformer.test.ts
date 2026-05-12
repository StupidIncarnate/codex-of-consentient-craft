import {
  AssistantTextChatEntryStub,
  AssistantThinkingChatEntryStub,
  AssistantToolUseChatEntryStub,
} from '@dungeonmaster/shared/contracts';

import {
  SingleGroupStub,
  SubagentChainGroupStub,
} from '../../contracts/chat-entry-group/chat-entry-group.stub';
import { findTrailingEmptyThinkingIndexTransformer } from './find-trailing-empty-thinking-index-transformer';

describe('findTrailingEmptyThinkingIndexTransformer', () => {
  describe('returns -1', () => {
    it('EMPTY: {groups: []} => returns -1', () => {
      expect(findTrailingEmptyThinkingIndexTransformer({ groups: [] })).toBe(-1);
    });

    it('VALID: {last group is text} => returns -1', () => {
      const groups = [SingleGroupStub({ entry: AssistantTextChatEntryStub() })];

      expect(findTrailingEmptyThinkingIndexTransformer({ groups })).toBe(-1);
    });

    it('VALID: {last group is tool_use} => returns -1', () => {
      const groups = [SingleGroupStub({ entry: AssistantToolUseChatEntryStub() })];

      expect(findTrailingEmptyThinkingIndexTransformer({ groups })).toBe(-1);
    });

    it('VALID: {last group is thinking with content} => returns -1', () => {
      const groups = [
        SingleGroupStub({ entry: AssistantThinkingChatEntryStub({ content: 'thinking...' }) }),
      ];

      expect(findTrailingEmptyThinkingIndexTransformer({ groups })).toBe(-1);
    });

    it('VALID: {last group is subagent-chain} => returns -1', () => {
      const groups = [SubagentChainGroupStub()];

      expect(findTrailingEmptyThinkingIndexTransformer({ groups })).toBe(-1);
    });
  });

  describe('returns last index', () => {
    it('VALID: {only group is empty thinking} => returns 0', () => {
      const groups = [SingleGroupStub({ entry: AssistantThinkingChatEntryStub({ content: '' }) })];

      expect(findTrailingEmptyThinkingIndexTransformer({ groups })).toBe(0);
    });

    it('VALID: {text then empty thinking} => returns 1', () => {
      const groups = [
        SingleGroupStub({ entry: AssistantTextChatEntryStub() }),
        SingleGroupStub({ entry: AssistantThinkingChatEntryStub({ content: '' }) }),
      ];

      expect(findTrailingEmptyThinkingIndexTransformer({ groups })).toBe(1);
    });
  });
});
