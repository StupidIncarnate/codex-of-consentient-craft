import { wsConsumeCallsExtractTransformer } from './ws-consume-calls-extract-transformer';
import { ContentTextStub } from '../../contracts/content-text/content-text.stub';

describe('wsConsumeCallsExtractTransformer', () => {
  describe('single-quoted type literal', () => {
    it('VALID: {single-quoted consumer branch} => returns the type literal', () => {
      const result = wsConsumeCallsExtractTransformer({
        source: ContentTextStub({
          value: "if (parsed.data.type === 'chat-output') {",
        }),
      });

      expect(result).toStrictEqual(['chat-output']);
    });
  });

  describe('double-quoted type literal', () => {
    it('VALID: {double-quoted consumer branch} => returns the type literal', () => {
      const result = wsConsumeCallsExtractTransformer({
        source: ContentTextStub({
          value: 'if (parsed.data.type === "chat-complete") {',
        }),
      });

      expect(result).toStrictEqual(['chat-complete']);
    });
  });

  describe('multiple consumer branches', () => {
    it('VALID: {two consumer branches} => returns both type literals', () => {
      const result = wsConsumeCallsExtractTransformer({
        source: ContentTextStub({
          value: [
            "if (parsed.data.type === 'chat-output') {",
            "if (parsed.data.type === 'chat-complete') {",
          ].join('\n'),
        }),
      });

      expect(result).toStrictEqual(['chat-output', 'chat-complete']);
    });
  });

  describe('no consumer branches', () => {
    it('EMPTY: {source with no consumer branches} => returns empty array', () => {
      const result = wsConsumeCallsExtractTransformer({
        source: ContentTextStub({
          value: "if (data.type === 'chat-output') {",
        }),
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('whitespace variants', () => {
    it('VALID: {extra whitespace around parens and operator} => returns the type literal', () => {
      const result = wsConsumeCallsExtractTransformer({
        source: ContentTextStub({
          value: "if ( parsed.data.type  ===  'clarification-request' ) {",
        }),
      });

      expect(result).toStrictEqual(['clarification-request']);
    });
  });
});
