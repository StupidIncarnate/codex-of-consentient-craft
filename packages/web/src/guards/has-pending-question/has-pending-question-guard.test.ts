import {
  AssistantTextChatEntryStub,
  AssistantToolUseChatEntryStub,
  UserChatEntryStub,
} from '../../contracts/chat-entry/chat-entry.stub';

import { hasPendingQuestionGuard } from './has-pending-question-guard';

describe('hasPendingQuestionGuard', () => {
  describe('pending question exists', () => {
    it('VALID: {last entry is AskUserQuestion tool_use} => returns true', () => {
      const result = hasPendingQuestionGuard({
        entries: [
          UserChatEntryStub(),
          AssistantToolUseChatEntryStub({ toolName: 'AskUserQuestion' as never }),
        ],
      });

      expect(result).toBe(true);
    });

    it('VALID: {AskUserQuestion followed by non-user entries} => returns true', () => {
      const result = hasPendingQuestionGuard({
        entries: [
          UserChatEntryStub(),
          AssistantToolUseChatEntryStub({ toolName: 'AskUserQuestion' as never }),
          AssistantTextChatEntryStub(),
        ],
      });

      expect(result).toBe(true);
    });
  });

  describe('no pending question', () => {
    it('VALID: {user entry follows AskUserQuestion} => returns false', () => {
      const result = hasPendingQuestionGuard({
        entries: [
          AssistantToolUseChatEntryStub({ toolName: 'AskUserQuestion' as never }),
          UserChatEntryStub(),
        ],
      });

      expect(result).toBe(false);
    });

    it('VALID: {no AskUserQuestion in entries} => returns false', () => {
      const result = hasPendingQuestionGuard({
        entries: [
          UserChatEntryStub(),
          AssistantToolUseChatEntryStub(),
          AssistantTextChatEntryStub(),
        ],
      });

      expect(result).toBe(false);
    });

    it('VALID: {only user entries} => returns false', () => {
      const result = hasPendingQuestionGuard({
        entries: [UserChatEntryStub()],
      });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {empty array} => returns false', () => {
      const result = hasPendingQuestionGuard({ entries: [] });

      expect(result).toBe(false);
    });

    it('EMPTY: {entries undefined} => returns false', () => {
      const result = hasPendingQuestionGuard({});

      expect(result).toBe(false);
    });
  });
});
