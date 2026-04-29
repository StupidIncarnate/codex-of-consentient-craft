import { assistantContentBlockParamContract } from './assistant-content-block-param-contract';
import { AssistantContentBlockParamStub } from './assistant-content-block-param.stub';

describe('assistantContentBlockParamContract', () => {
  describe('valid input', () => {
    it('VALID: {type: "text"} => parses as TextBlockParam', () => {
      const result = AssistantContentBlockParamStub();

      expect(result).toStrictEqual({
        type: 'text',
        text: 'I can help you with that.',
      });
    });

    it('VALID: {type: "thinking"} => parses as ThinkingBlockParam', () => {
      const result = assistantContentBlockParamContract.parse({
        type: 'thinking',
        thinking: 'Let me reason...',
      });

      expect(result.type).toBe('thinking');
    });

    it('VALID: {type: "redacted_thinking"} => parses as RedactedThinkingBlockParam', () => {
      const result = assistantContentBlockParamContract.parse({
        type: 'redacted_thinking',
        data: 'EncryptedBlob==',
      });

      expect(result.type).toBe('redacted_thinking');
    });

    it('VALID: {type: "tool_use"} => parses as ToolUseBlockParam', () => {
      const result = assistantContentBlockParamContract.parse({
        type: 'tool_use',
        id: 'toolu_01EaCJyt5y8gzMNyGYarwUDZ',
        name: 'Bash',
        input: { command: 'ls' },
      });

      expect(result.type).toBe('tool_use');
    });

    it('VALID: {type: "tool_result"} => parses as ToolResultBlockParam', () => {
      const result = assistantContentBlockParamContract.parse({
        type: 'tool_result',
        tool_use_id: 'toolu_01EaCJyt5y8gzMNyGYarwUDZ',
        content: 'result text',
      });

      expect(result.type).toBe('tool_result');
    });
  });

  describe('invalid input', () => {
    it('INVALID: {type: "image"} => throws unknown discriminator value', () => {
      expect(() =>
        assistantContentBlockParamContract.parse({
          type: 'image',
          source: { type: 'url', url: 'https://example.com/img.png' },
        }),
      ).toThrow(/Invalid discriminator value/u);
    });

    it('INVALID: {type: "document"} => throws unknown discriminator value', () => {
      expect(() =>
        assistantContentBlockParamContract.parse({
          type: 'document',
          source: { type: 'url', url: 'https://example.com/doc.pdf' },
        }),
      ).toThrow(/Invalid discriminator value/u);
    });

    it('INVALID: {type: "search_result"} => throws unknown discriminator value', () => {
      expect(() =>
        assistantContentBlockParamContract.parse({
          type: 'search_result',
          source: 'https://example.com',
          title: 'Title',
          content: [],
        }),
      ).toThrow(/Invalid discriminator value/u);
    });

    it('INVALID: {type: 123} => throws on invalid discriminator value', () => {
      expect(() => assistantContentBlockParamContract.parse({ type: 123 as never })).toThrow(
        /Invalid discriminator value/u,
      );
    });
  });
});
