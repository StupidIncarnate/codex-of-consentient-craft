import { searchResultBlockParamContract } from './search-result-block-param-contract';
import { SearchResultBlockParamStub } from './search-result-block-param.stub';

describe('searchResultBlockParamContract', () => {
  describe('valid input', () => {
    it('VALID: {type: "search_result", content: [TextBlockParam]} => returns SearchResultBlockParam', () => {
      const result = SearchResultBlockParamStub();

      expect(result).toStrictEqual({
        type: 'search_result',
        source: 'https://example.com/article',
        title: 'Example Article Title',
        content: [{ type: 'text', text: 'The article content goes here.' }],
      });
    });

    it('VALID: {content: []} => accepts empty content array', () => {
      const result = searchResultBlockParamContract.parse({
        type: 'search_result',
        source: 'https://example.com',
        title: 'Title',
        content: [],
      });

      expect(result.content).toStrictEqual([]);
    });

    it('VALID: {content: [multiple TextBlockParams]} => accepts multiple text blocks', () => {
      const result = searchResultBlockParamContract.parse({
        type: 'search_result',
        source: 'https://example.com',
        title: 'Title',
        content: [
          { type: 'text', text: 'First paragraph.' },
          { type: 'text', text: 'Second paragraph.' },
        ],
      });

      expect(result.content).toStrictEqual([
        { type: 'text', text: 'First paragraph.' },
        { type: 'text', text: 'Second paragraph.' },
      ]);
    });
  });

  describe('invalid input', () => {
    it('INVALID: {type: "text"} => throws wrong discriminator', () => {
      expect(() =>
        searchResultBlockParamContract.parse({
          type: 'text',
          source: 'https://example.com',
          title: 'Title',
          content: [],
        }),
      ).toThrow(/Invalid literal value/u);
    });

    it('INVALID: {source missing} => throws on missing required field', () => {
      expect(() =>
        searchResultBlockParamContract.parse({
          type: 'search_result',
          title: 'Title',
          content: [],
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID: {title missing} => throws on missing required field', () => {
      expect(() =>
        searchResultBlockParamContract.parse({
          type: 'search_result',
          source: 'https://example.com',
          content: [],
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID: {content: 123} => throws on non-array content', () => {
      expect(() =>
        searchResultBlockParamContract.parse({
          type: 'search_result',
          source: 'https://example.com',
          title: 'Title',
          content: 123 as never,
        }),
      ).toThrow(/Expected array/u);
    });
  });
});
