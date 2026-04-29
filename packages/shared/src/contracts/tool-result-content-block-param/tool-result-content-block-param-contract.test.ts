import { toolResultContentBlockParamContract } from './tool-result-content-block-param-contract';
import { ToolResultContentBlockParamStub } from './tool-result-content-block-param.stub';

describe('toolResultContentBlockParamContract', () => {
  describe('valid input', () => {
    it('VALID: {type: "text"} => parses as TextBlockParam', () => {
      const result = ToolResultContentBlockParamStub();

      expect(result).toStrictEqual({
        type: 'text',
        text: 'Tool result content.',
      });
    });

    it('VALID: {type: "image", source.type: "url"} => parses as ImageBlockParam', () => {
      const result = toolResultContentBlockParamContract.parse({
        type: 'image',
        source: { type: 'url', url: 'https://example.com/screenshot.png' },
      });

      expect(result.type).toBe('image');
    });

    it('VALID: {type: "search_result"} => parses as SearchResultBlockParam', () => {
      const result = toolResultContentBlockParamContract.parse({
        type: 'search_result',
        source: 'https://example.com',
        title: 'Example',
        content: [],
      });

      expect(result.type).toBe('search_result');
    });

    it('VALID: {type: "document", source.type: "url"} => parses as DocumentBlockParam', () => {
      const result = toolResultContentBlockParamContract.parse({
        type: 'document',
        source: { type: 'url', url: 'https://example.com/doc.pdf' },
      });

      expect(result.type).toBe('document');
    });

    it('VALID: {type: "tool_reference"} => parses as ToolReferenceBlockParam', () => {
      const result = toolResultContentBlockParamContract.parse({
        type: 'tool_reference',
        tool_name: 'Bash',
      });

      expect(result.type).toBe('tool_reference');
    });
  });

  describe('invalid input', () => {
    it('INVALID: {type: "thinking"} => throws unknown discriminator value', () => {
      expect(() =>
        toolResultContentBlockParamContract.parse({
          type: 'thinking',
          thinking: 'some reasoning',
        }),
      ).toThrow(/Invalid discriminator value/u);
    });

    it('INVALID: {type: "tool_result"} => throws unknown discriminator value', () => {
      expect(() =>
        toolResultContentBlockParamContract.parse({
          type: 'tool_result',
          tool_use_id: 'toolu_abc',
        }),
      ).toThrow(/Invalid discriminator value/u);
    });

    it('INVALID: {type: 123} => throws on invalid discriminator value', () => {
      expect(() => toolResultContentBlockParamContract.parse({ type: 123 as never })).toThrow(
        /Invalid discriminator value/u,
      );
    });
  });
});
