import {
  AssistantTextChatEntryStub,
  AssistantThinkingChatEntryStub,
  AssistantToolUseChatEntryStub,
  UserChatEntryStub,
} from '@dungeonmaster/shared/contracts';

import {
  SingleGroupStub,
  SubagentChainGroupStub,
} from '../../contracts/chat-entry-group/chat-entry-group.stub';
import { computeGroupTailIndexTransformer } from './compute-group-tail-index-transformer';

describe('computeGroupTailIndexTransformer', () => {
  describe('empty input', () => {
    it('EMPTY: {groups: []} => returns 0', () => {
      const result = computeGroupTailIndexTransformer({ groups: [] });

      expect(result).toBe(0);
    });
  });

  describe('no message anchor present', () => {
    it('VALID: {groups: [tool_use single]} => returns 0 (last group fallback)', () => {
      const groups = [SingleGroupStub({ entry: AssistantToolUseChatEntryStub() })];

      const result = computeGroupTailIndexTransformer({ groups });

      expect(result).toBe(0);
    });

    it('VALID: {groups: [tool_use, tool_use, tool_use]} => returns 2 (last group fallback)', () => {
      const groups = [
        SingleGroupStub({ entry: AssistantToolUseChatEntryStub() }),
        SingleGroupStub({ entry: AssistantToolUseChatEntryStub() }),
        SingleGroupStub({ entry: AssistantToolUseChatEntryStub() }),
      ];

      const result = computeGroupTailIndexTransformer({ groups });

      expect(result).toBe(2);
    });

    it('VALID: {groups: [thinking, tool_use]} => returns 1 (thinking is not anchor)', () => {
      const groups = [
        SingleGroupStub({ entry: AssistantThinkingChatEntryStub() }),
        SingleGroupStub({ entry: AssistantToolUseChatEntryStub() }),
      ];

      const result = computeGroupTailIndexTransformer({ groups });

      expect(result).toBe(1);
    });
  });

  describe('message anchor present', () => {
    it('VALID: {groups: [text]} => returns 0', () => {
      const groups = [SingleGroupStub({ entry: AssistantTextChatEntryStub() })];

      const result = computeGroupTailIndexTransformer({ groups });

      expect(result).toBe(0);
    });

    it('VALID: {groups: [text, tool, tool]} => returns 0', () => {
      const groups = [
        SingleGroupStub({ entry: AssistantTextChatEntryStub() }),
        SingleGroupStub({ entry: AssistantToolUseChatEntryStub() }),
        SingleGroupStub({ entry: AssistantToolUseChatEntryStub() }),
      ];

      const result = computeGroupTailIndexTransformer({ groups });

      expect(result).toBe(0);
    });

    it('VALID: {groups: [text, tool, text, tool]} => returns 2 (last text wins)', () => {
      const groups = [
        SingleGroupStub({ entry: AssistantTextChatEntryStub({ content: 'first' }) }),
        SingleGroupStub({ entry: AssistantToolUseChatEntryStub() }),
        SingleGroupStub({ entry: AssistantTextChatEntryStub({ content: 'second' }) }),
        SingleGroupStub({ entry: AssistantToolUseChatEntryStub() }),
      ];

      const result = computeGroupTailIndexTransformer({ groups });

      expect(result).toBe(2);
    });

    it('VALID: {groups: [tool, user, tool]} => returns 1 (user prompt is anchor)', () => {
      const groups = [
        SingleGroupStub({ entry: AssistantToolUseChatEntryStub() }),
        SingleGroupStub({ entry: UserChatEntryStub() }),
        SingleGroupStub({ entry: AssistantToolUseChatEntryStub() }),
      ];

      const result = computeGroupTailIndexTransformer({ groups });

      expect(result).toBe(1);
    });
  });

  describe('subagent chain anchors', () => {
    it('VALID: {groups: [subagent-chain]} => returns 0 (chain itself is anchor)', () => {
      const groups = [SubagentChainGroupStub()];

      const result = computeGroupTailIndexTransformer({ groups });

      expect(result).toBe(0);
    });

    it('VALID: {groups: [text, subagent-chain]} => returns 1 (chain is more recent anchor)', () => {
      const groups = [
        SingleGroupStub({ entry: AssistantTextChatEntryStub() }),
        SubagentChainGroupStub(),
      ];

      const result = computeGroupTailIndexTransformer({ groups });

      expect(result).toBe(1);
    });

    it('VALID: {groups: [subagent-chain, tool, text]} => returns 2 (last text after chain wins)', () => {
      const groups = [
        SubagentChainGroupStub(),
        SingleGroupStub({ entry: AssistantToolUseChatEntryStub() }),
        SingleGroupStub({ entry: AssistantTextChatEntryStub() }),
      ];

      const result = computeGroupTailIndexTransformer({ groups });

      expect(result).toBe(2);
    });

    it('VALID: {groups: [subagent-chain, tool, tool]} => returns 0 (chain is most recent anchor)', () => {
      const groups = [
        SubagentChainGroupStub(),
        SingleGroupStub({ entry: AssistantToolUseChatEntryStub() }),
        SingleGroupStub({ entry: AssistantToolUseChatEntryStub() }),
      ];

      const result = computeGroupTailIndexTransformer({ groups });

      expect(result).toBe(0);
    });
  });
});
