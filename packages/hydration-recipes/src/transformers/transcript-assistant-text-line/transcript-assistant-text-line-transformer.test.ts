import { transcriptAssistantTextLineTransformer } from './transcript-assistant-text-line-transformer';

describe('transcriptAssistantTextLineTransformer', () => {
  describe('without usage', () => {
    it('VALID: {text: "Nested agent 1 response"} => returns the assistant text line with no usage', () => {
      const result = transcriptAssistantTextLineTransformer({ text: 'Nested agent 1 response' });

      expect(result).toStrictEqual({
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [{ type: 'text', text: 'Nested agent 1 response' }],
        },
      });
    });
  });

  describe('with usage', () => {
    it('VALID: {text, usage: {inputTokens: 12, outputTokens: 34}} => returns the line carrying snake_case usage', () => {
      const result = transcriptAssistantTextLineTransformer({
        text: 'Outer agent reply',
        usage: { inputTokens: 12, outputTokens: 34 },
      });

      expect(result).toStrictEqual({
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [{ type: 'text', text: 'Outer agent reply' }],
          usage: { input_tokens: 12, output_tokens: 34 },
        },
      });
    });
  });
});
