import {
  AssistantTextChatEntryStub,
  AssistantThinkingChatEntryStub,
  AssistantToolResultChatEntryStub,
  AssistantToolUseChatEntryStub,
  SystemErrorChatEntryStub,
  TaskNotificationChatEntryStub,
  UserChatEntryStub,
} from '@dungeonmaster/shared/contracts';

import { isMessageAnchorEntryGuard } from './is-message-anchor-entry-guard';

describe('isMessageAnchorEntryGuard', () => {
  describe('anchor entries', () => {
    it('VALID: {entry: user} => returns true (user prompt is prose)', () => {
      const entry = UserChatEntryStub();

      expect(isMessageAnchorEntryGuard({ entry })).toBe(true);
    });

    it('VALID: {entry: subagent user prompt} => returns true', () => {
      const entry = UserChatEntryStub({ source: 'subagent' });

      expect(isMessageAnchorEntryGuard({ entry })).toBe(true);
    });

    it('VALID: {entry: assistant text} => returns true (prose)', () => {
      const entry = AssistantTextChatEntryStub();

      expect(isMessageAnchorEntryGuard({ entry })).toBe(true);
    });

    it('VALID: {entry: subagent text} => returns true', () => {
      const entry = AssistantTextChatEntryStub({ source: 'subagent' });

      expect(isMessageAnchorEntryGuard({ entry })).toBe(true);
    });

    it('VALID: {entry: task_notification} => returns true (final report is anchorable)', () => {
      const entry = TaskNotificationChatEntryStub();

      expect(isMessageAnchorEntryGuard({ entry })).toBe(true);
    });

    it('VALID: {entry: system error} => returns true (error message is anchorable)', () => {
      const entry = SystemErrorChatEntryStub();

      expect(isMessageAnchorEntryGuard({ entry })).toBe(true);
    });
  });

  describe('non-anchor entries', () => {
    it('VALID: {entry: assistant tool_use} => returns false (tool noise)', () => {
      const entry = AssistantToolUseChatEntryStub();

      expect(isMessageAnchorEntryGuard({ entry })).toBe(false);
    });

    it('VALID: {entry: assistant tool_result} => returns false (tool noise)', () => {
      const entry = AssistantToolResultChatEntryStub();

      expect(isMessageAnchorEntryGuard({ entry })).toBe(false);
    });

    it('VALID: {entry: assistant thinking} => returns false (internal monologue)', () => {
      const entry = AssistantThinkingChatEntryStub();

      expect(isMessageAnchorEntryGuard({ entry })).toBe(false);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {entry: undefined} => returns false', () => {
      expect(isMessageAnchorEntryGuard({})).toBe(false);
    });
  });
});
