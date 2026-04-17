import { computeRowContextTotalTransformer } from './compute-row-context-total-transformer';
import { AssistantTextChatEntryStub, UserChatEntryStub } from '@dungeonmaster/shared/contracts';

describe('computeRowContextTotalTransformer', () => {
  describe('empty and no-usage cases', () => {
    it('EMPTY: {entries: []} => returns null', () => {
      const result = computeRowContextTotalTransformer({ entries: [] });

      expect(result).toBe(null);
    });

    it('VALID: {entries: [entry with no usage]} => returns null', () => {
      const result = computeRowContextTotalTransformer({
        entries: [UserChatEntryStub()],
      });

      expect(result).toBe(null);
    });
  });

  describe('entries with usage', () => {
    it('VALID: {entries: [entry with usage, 500 tokens]} => returns "500"', () => {
      const result = computeRowContextTotalTransformer({
        entries: [
          AssistantTextChatEntryStub({
            usage: {
              inputTokens: 400,
              outputTokens: 50,
              cacheCreationInputTokens: 60,
              cacheReadInputTokens: 40,
            },
          }),
        ],
      });

      expect(result).toBe('500');
    });

    it('VALID: {entries: [entry with usage 500, entry with usage 29448]} => returns "29.4k" (last wins)', () => {
      const result = computeRowContextTotalTransformer({
        entries: [
          AssistantTextChatEntryStub({
            usage: {
              inputTokens: 400,
              outputTokens: 50,
              cacheCreationInputTokens: 60,
              cacheReadInputTokens: 40,
            },
          }),
          AssistantTextChatEntryStub({
            usage: {
              inputTokens: 20000,
              outputTokens: 500,
              cacheCreationInputTokens: 5448,
              cacheReadInputTokens: 4000,
            },
          }),
        ],
      });

      expect(result).toBe('29.4k');
    });

    it('VALID: {entries: [entry with usage, entry without usage]} => returns formatted total from first', () => {
      const result = computeRowContextTotalTransformer({
        entries: [
          AssistantTextChatEntryStub({
            usage: {
              inputTokens: 400,
              outputTokens: 50,
              cacheCreationInputTokens: 60,
              cacheReadInputTokens: 40,
            },
          }),
          UserChatEntryStub(),
        ],
      });

      expect(result).toBe('500');
    });
  });
});
