import { markdownSpanContract } from './markdown-span-contract';
import {
  MarkdownBoldSpanStub,
  MarkdownCodeSpanStub,
  MarkdownLinkSpanStub,
  MarkdownSpanStub,
} from './markdown-span.stub';

describe('markdownSpanContract', () => {
  describe('valid inputs', () => {
    it('VALID: {kind: "text"} => parses a plain run', () => {
      const result = markdownSpanContract.parse({ kind: 'text', text: 'plain words' });

      expect(result).toStrictEqual({ kind: 'text', text: 'plain words' });
    });

    it('VALID: {kind: "bold"} => parses a bold run', () => {
      const result = markdownSpanContract.parse({ kind: 'bold', text: 'important' });

      expect(result).toStrictEqual({ kind: 'bold', text: 'important' });
    });

    it('VALID: {kind: "italic"} => parses an italic run', () => {
      const result = markdownSpanContract.parse({ kind: 'italic', text: 'emphasis' });

      expect(result).toStrictEqual({ kind: 'italic', text: 'emphasis' });
    });

    it('VALID: {kind: "code"} => parses an inline code run', () => {
      const result = markdownSpanContract.parse({ kind: 'code', text: 'navigationHarness' });

      expect(result).toStrictEqual({ kind: 'code', text: 'navigationHarness' });
    });

    it('VALID: {kind: "link"} => parses a link with its href', () => {
      const result = markdownSpanContract.parse({
        kind: 'link',
        text: 'the docs',
        href: 'https://example.com',
      });

      expect(result).toStrictEqual({
        kind: 'link',
        text: 'the docs',
        href: 'https://example.com',
      });
    });

    it('EMPTY: {kind: "text", text: ""} => parses an empty run', () => {
      const result = markdownSpanContract.parse({ kind: 'text', text: '' });

      expect(result).toStrictEqual({ kind: 'text', text: '' });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {kind: "strikethrough"} => throws for a mark outside the dialect', () => {
      expect(() => markdownSpanContract.parse({ kind: 'strikethrough', text: 'gone' })).toThrow(
        /Invalid discriminator value/u,
      );
    });

    it('INVALID: {kind: "link", no href} => throws when a link omits its target', () => {
      expect(() => markdownSpanContract.parse({ kind: 'link', text: 'the docs' })).toThrow(
        /Required/u,
      );
    });

    it('EMPTY: {value: undefined} => throws for undefined', () => {
      expect(() => markdownSpanContract.parse(undefined)).toThrow(/Required/u);
    });
  });

  describe('stubs', () => {
    it('VALID: {default} => creates a plain text span', () => {
      const result = MarkdownSpanStub();

      expect(result).toStrictEqual({ kind: 'text', text: 'plain words' });
    });

    it('VALID: {bold stub default} => creates a bold span', () => {
      const result = MarkdownBoldSpanStub();

      expect(result).toStrictEqual({ kind: 'bold', text: 'important' });
    });

    it('VALID: {code stub with custom text} => creates a code span carrying that text', () => {
      const result = MarkdownCodeSpanStub({ text: 'toolRowSummaryTransformer' } as never);

      expect(result).toStrictEqual({ kind: 'code', text: 'toolRowSummaryTransformer' });
    });

    it('VALID: {link stub default} => creates a link span with its href', () => {
      const result = MarkdownLinkSpanStub();

      expect(result).toStrictEqual({
        kind: 'link',
        text: 'the docs',
        href: 'https://example.com',
      });
    });
  });
});
