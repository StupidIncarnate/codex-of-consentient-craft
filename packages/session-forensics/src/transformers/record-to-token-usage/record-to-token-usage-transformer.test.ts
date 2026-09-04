import { recordToTokenUsageTransformer } from './record-to-token-usage-transformer';
import { TranscriptRecordStub } from '../../contracts/transcript-record/transcript-record.stub';
import { TokenUsageStub } from '../../contracts/token-usage/token-usage.stub';

describe('recordToTokenUsageTransformer', () => {
  describe('full usage object', () => {
    it('VALID: {all five usage counts non-zero} => returns each field read from its snake_case key', () => {
      const record = TranscriptRecordStub({
        message: {
          content: 'Reading the file now.',
          usage: {
            input_tokens: 2,
            cache_creation_input_tokens: 32_335,
            cache_read_input_tokens: 14_500_661,
            output_tokens: 239,
            output_tokens_details: { thinking_tokens: 51_539 },
          },
        },
      });

      const result = recordToTokenUsageTransformer({ record });

      expect(result).toStrictEqual(
        TokenUsageStub({
          inputTokens: 2,
          outputTokens: 239,
          cacheReadTokens: 14_500_661,
          cacheCreationTokens: 32_335,
          thinkingTokens: 51_539,
        }),
      );
    });
  });

  describe('message or usage absent', () => {
    it('EMPTY: {no message} => returns all five counts as zero', () => {
      const record = TranscriptRecordStub({ type: 'attachment', message: undefined });

      const result = recordToTokenUsageTransformer({ record });

      expect(result).toStrictEqual(
        TokenUsageStub({
          inputTokens: 0,
          outputTokens: 0,
          cacheReadTokens: 0,
          cacheCreationTokens: 0,
          thinkingTokens: 0,
        }),
      );
    });

    it('EMPTY: {message with no usage} => returns all five counts as zero', () => {
      const record = TranscriptRecordStub({
        type: 'user',
        message: { content: 'What does this function return?' },
      });

      const result = recordToTokenUsageTransformer({ record });

      expect(result).toStrictEqual(
        TokenUsageStub({
          inputTokens: 0,
          outputTokens: 0,
          cacheReadTokens: 0,
          cacheCreationTokens: 0,
          thinkingTokens: 0,
        }),
      );
    });
  });

  describe('partial or malformed usage', () => {
    it('EDGE: {usage without output_tokens_details} => thinkingTokens 0, the other four read', () => {
      const record = TranscriptRecordStub({
        message: {
          content: 'On it.',
          usage: {
            input_tokens: 2,
            cache_creation_input_tokens: 32_335,
            cache_read_input_tokens: 0,
            output_tokens: 239,
          },
        },
      });

      const result = recordToTokenUsageTransformer({ record });

      expect(result).toStrictEqual(
        TokenUsageStub({
          inputTokens: 2,
          outputTokens: 239,
          cacheReadTokens: 0,
          cacheCreationTokens: 32_335,
          thinkingTokens: 0,
        }),
      );
    });

    it('EDGE: {usage with only output_tokens} => that value, the other four zero', () => {
      const record = TranscriptRecordStub({
        message: {
          content: 'On it.',
          usage: { output_tokens: 239 },
        },
      });

      const result = recordToTokenUsageTransformer({ record });

      expect(result).toStrictEqual(
        TokenUsageStub({
          inputTokens: 0,
          outputTokens: 239,
          cacheReadTokens: 0,
          cacheCreationTokens: 0,
          thinkingTokens: 0,
        }),
      );
    });

    it('EDGE: {output_tokens_details present but empty} => thinkingTokens 0', () => {
      const record = TranscriptRecordStub({
        message: {
          content: 'On it.',
          usage: {
            input_tokens: 2,
            output_tokens: 239,
            cache_read_input_tokens: 0,
            cache_creation_input_tokens: 32_335,
            output_tokens_details: {},
          },
        },
      });

      const result = recordToTokenUsageTransformer({ record });

      expect(result).toStrictEqual(
        TokenUsageStub({
          inputTokens: 2,
          outputTokens: 239,
          cacheReadTokens: 0,
          cacheCreationTokens: 32_335,
          thinkingTokens: 0,
        }),
      );
    });

    it('EDGE: {usage with extra unknown keys} => those are ignored, the five are still read', () => {
      const record = TranscriptRecordStub({
        message: {
          content: 'On it.',
          usage: {
            input_tokens: 2,
            output_tokens: 239,
            cache_read_input_tokens: 0,
            cache_creation_input_tokens: 32_335,
            output_tokens_details: { thinking_tokens: 51_539 },
            service_tier: 'standard',
            cache_creation: { ephemeral_5m_input_tokens: 32_335, ephemeral_1h_input_tokens: 0 },
          },
        },
      });

      const result = recordToTokenUsageTransformer({ record });

      expect(result).toStrictEqual(
        TokenUsageStub({
          inputTokens: 2,
          outputTokens: 239,
          cacheReadTokens: 0,
          cacheCreationTokens: 32_335,
          thinkingTokens: 51_539,
        }),
      );
    });
  });
});
