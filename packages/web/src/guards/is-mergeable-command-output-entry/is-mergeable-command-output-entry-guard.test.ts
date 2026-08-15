import {
  AssistantTextChatEntryStub,
  AssistantThinkingChatEntryStub,
  AssistantToolResultChatEntryStub,
  AssistantToolUseChatEntryStub,
  UserChatEntryStub,
} from '@dungeonmaster/shared/contracts';

import { isMergeableCommandOutputEntryGuard } from './is-mergeable-command-output-entry-guard';

describe('isMergeableCommandOutputEntryGuard', () => {
  describe('mergeable', () => {
    it('VALID: {assistant text entry} => returns true', () => {
      const entry = AssistantTextChatEntryStub({ content: '— build pass 1/3 —' });

      expect(isMergeableCommandOutputEntryGuard({ entry })).toBe(true);
    });

    it('EDGE: {assistant text entry with empty content} => returns true so blank output lines join the block', () => {
      const entry = AssistantTextChatEntryStub({ content: '' });

      expect(isMergeableCommandOutputEntryGuard({ entry })).toBe(true);
    });
  });

  describe('not mergeable', () => {
    it('VALID: {assistant text carrying usage} => returns false because a context divider hangs off it', () => {
      const entry = AssistantTextChatEntryStub({
        content: 'accounted',
        usage: {
          inputTokens: 10,
          outputTokens: 20,
          cacheCreationInputTokens: 0,
          cacheReadInputTokens: 0,
        },
      });

      expect(isMergeableCommandOutputEntryGuard({ entry })).toBe(false);
    });

    it('VALID: {tool_use entry} => returns false', () => {
      expect(isMergeableCommandOutputEntryGuard({ entry: AssistantToolUseChatEntryStub({}) })).toBe(
        false,
      );
    });

    it('VALID: {tool_result entry} => returns false', () => {
      expect(
        isMergeableCommandOutputEntryGuard({ entry: AssistantToolResultChatEntryStub({}) }),
      ).toBe(false);
    });

    it('VALID: {thinking entry} => returns false', () => {
      expect(
        isMergeableCommandOutputEntryGuard({ entry: AssistantThinkingChatEntryStub({}) }),
      ).toBe(false);
    });

    it('VALID: {user entry} => returns false', () => {
      expect(isMergeableCommandOutputEntryGuard({ entry: UserChatEntryStub({}) })).toBe(false);
    });

    it('EMPTY: {no entry} => returns false because an unopened run has nothing to extend', () => {
      expect(isMergeableCommandOutputEntryGuard({})).toBe(false);
    });
  });
});
