import {
  AssistantTextChatEntryStub,
  AssistantToolResultChatEntryStub,
  AssistantToolUseChatEntryStub,
  SystemErrorChatEntryStub,
  UserChatEntryStub,
} from '../../contracts/chat-entry/chat-entry.stub';
import { isToolEntryGuard } from './is-tool-entry-guard';

describe('isToolEntryGuard', () => {
  describe('tool entries', () => {
    it('VALID: {entry: tool_use} => returns true', () => {
      const result = isToolEntryGuard({ entry: AssistantToolUseChatEntryStub() });

      expect(result).toBe(true);
    });

    it('VALID: {entry: tool_result} => returns true', () => {
      const result = isToolEntryGuard({ entry: AssistantToolResultChatEntryStub() });

      expect(result).toBe(true);
    });
  });

  describe('non-tool entries', () => {
    it('VALID: {entry: user} => returns false', () => {
      const result = isToolEntryGuard({ entry: UserChatEntryStub() });

      expect(result).toBe(false);
    });

    it('VALID: {entry: assistant text} => returns false', () => {
      const result = isToolEntryGuard({ entry: AssistantTextChatEntryStub() });

      expect(result).toBe(false);
    });

    it('VALID: {entry: system error} => returns false', () => {
      const result = isToolEntryGuard({ entry: SystemErrorChatEntryStub() });

      expect(result).toBe(false);
    });
  });

  describe('undefined entry', () => {
    it('EMPTY: {entry: undefined} => returns false', () => {
      const result = isToolEntryGuard({});

      expect(result).toBe(false);
    });
  });
});
