import { mapUsageToChatUsageTransformer } from './map-usage-to-chat-usage-transformer';

describe('mapUsageToChatUsageTransformer', () => {
  describe('valid usage', () => {
    it('VALID: {all fields present} => returns camelCase usage', () => {
      const result = mapUsageToChatUsageTransformer({
        usage: {
          input_tokens: 100,
          output_tokens: 50,
          cache_creation_input_tokens: 10,
          cache_read_input_tokens: 5,
        },
      });

      expect(result).toStrictEqual({
        inputTokens: 100,
        outputTokens: 50,
        cacheCreationInputTokens: 10,
        cacheReadInputTokens: 5,
      });
    });
  });

  describe('missing fields', () => {
    it('EDGE: {empty usage object} => returns all zeros', () => {
      const result = mapUsageToChatUsageTransformer({ usage: {} });

      expect(result).toStrictEqual({
        inputTokens: 0,
        outputTokens: 0,
        cacheCreationInputTokens: 0,
        cacheReadInputTokens: 0,
      });
    });

    it('EDGE: {partial fields} => defaults missing to zero', () => {
      const result = mapUsageToChatUsageTransformer({
        usage: { input_tokens: 42 },
      });

      expect(result).toStrictEqual({
        inputTokens: 42,
        outputTokens: 0,
        cacheCreationInputTokens: 0,
        cacheReadInputTokens: 0,
      });
    });
  });
});
