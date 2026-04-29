import { documentBlockParamContract } from './document-block-param-contract';
import {
  Base64DocumentBlockParamStub,
  ContentDocumentBlockParamStub,
  PlainTextDocumentBlockParamStub,
  UrlDocumentBlockParamStub,
} from './document-block-param.stub';

describe('documentBlockParamContract', () => {
  describe('valid input', () => {
    describe('base64 source variant', () => {
      it('VALID: {source.type: "base64", media_type: "application/pdf"} => returns DocumentBlockParam', () => {
        const result = Base64DocumentBlockParamStub();

        expect(result).toStrictEqual({
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: 'JVBERi0xLjQKJeLjz9MKCg==',
          },
        });
      });
    });

    describe('plain text source variant', () => {
      it('VALID: {source.type: "text", media_type: "text/plain"} => returns DocumentBlockParam', () => {
        const result = PlainTextDocumentBlockParamStub();

        expect(result).toStrictEqual({
          type: 'document',
          source: {
            type: 'text',
            media_type: 'text/plain',
            data: 'This is a plain text document.',
          },
        });
      });
    });

    describe('url source variant', () => {
      it('VALID: {source.type: "url"} => returns DocumentBlockParam', () => {
        const result = UrlDocumentBlockParamStub();

        expect(result).toStrictEqual({
          type: 'document',
          source: {
            type: 'url',
            url: 'https://example.com/report.pdf',
          },
        });
      });
    });

    describe('content source variant', () => {
      it('VALID: {source.type: "content", content: string} => returns DocumentBlockParam', () => {
        const result = ContentDocumentBlockParamStub();

        expect(result).toStrictEqual({
          type: 'document',
          source: {
            type: 'content',
            content: 'Document content as a plain string.',
          },
        });
      });

      it('VALID: {source.content: TextBlockParam[]} => accepts text block array', () => {
        const result = documentBlockParamContract.parse({
          type: 'document',
          source: {
            type: 'content',
            content: [{ type: 'text', text: 'First paragraph' }],
          },
        });

        expect(result.source.type).toBe('content');
      });
    });

    describe('optional fields', () => {
      it('VALID: {title: "My Doc", context: "reference"} => includes optional fields', () => {
        const result = documentBlockParamContract.parse({
          type: 'document',
          source: { type: 'url', url: 'https://example.com/doc.pdf' },
          title: 'My Doc',
          context: 'reference',
        });

        expect(result).toStrictEqual({
          type: 'document',
          source: { type: 'url', url: 'https://example.com/doc.pdf' },
          title: 'My Doc',
          context: 'reference',
        });
      });

      it('VALID: {title: null} => accepts null title', () => {
        const result = documentBlockParamContract.parse({
          type: 'document',
          source: { type: 'url', url: 'https://example.com/doc.pdf' },
          title: null,
        });

        expect(result.title).toBe(null);
      });
    });
  });

  describe('invalid input', () => {
    it('INVALID: {type: "text"} => throws wrong discriminator', () => {
      expect(() =>
        documentBlockParamContract.parse({
          type: 'text',
          source: { type: 'url', url: 'https://example.com/doc.pdf' },
        }),
      ).toThrow(/Invalid literal value/u);
    });

    it('INVALID: {source missing} => throws on missing required field', () => {
      expect(() => documentBlockParamContract.parse({ type: 'document' })).toThrow(/Required/u);
    });

    it('INVALID: {source.type: "file"} => throws unknown discriminator value', () => {
      expect(() =>
        documentBlockParamContract.parse({
          type: 'document',
          source: { type: 'file', path: '/tmp/doc.pdf' },
        }),
      ).toThrow(/Invalid discriminator value/u);
    });

    it('INVALID: {source.type: "base64", media_type: "image/png"} => throws wrong pdf media_type', () => {
      expect(() =>
        documentBlockParamContract.parse({
          type: 'document',
          source: { type: 'base64', media_type: 'image/png', data: 'abc' },
        }),
      ).toThrow(/Invalid literal value/u);
    });
  });
});
