import {
  AssistantTextChatEntryStub,
  AssistantToolUseChatEntryStub,
  UserChatEntryStub,
} from '../../contracts/chat-entry/chat-entry.stub';
import { computeEntryContextTransformer } from './compute-entry-context-transformer';

describe('computeEntryContextTransformer', () => {
  describe('entries without usage', () => {
    it('VALID: {user entry} => returns null', () => {
      const entry = UserChatEntryStub();

      const result = computeEntryContextTransformer({ entry });

      expect(result).toBeNull();
    });

    it('VALID: {assistant text without usage} => returns null', () => {
      const entry = AssistantTextChatEntryStub();

      const result = computeEntryContextTransformer({ entry });

      expect(result).toBeNull();
    });
  });

  describe('entries with usage', () => {
    it('VALID: {entry with usage} => returns sum of input + cacheCreation + cacheRead', () => {
      const entry = AssistantToolUseChatEntryStub({
        usage: {
          inputTokens: 10000,
          outputTokens: 500,
          cacheCreationInputTokens: 3000,
          cacheReadInputTokens: 2000,
        },
      });

      const result = computeEntryContextTransformer({ entry });

      expect(result).toBe(15000);
    });

    it('VALID: {entry with zero cache tokens} => returns inputTokens only', () => {
      const entry = AssistantTextChatEntryStub({
        usage: {
          inputTokens: 5000,
          outputTokens: 200,
          cacheCreationInputTokens: 0,
          cacheReadInputTokens: 0,
        },
      });

      const result = computeEntryContextTransformer({ entry });

      expect(result).toBe(5000);
    });
  });
});
