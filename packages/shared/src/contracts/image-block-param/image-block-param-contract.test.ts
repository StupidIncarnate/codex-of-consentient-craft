import { imageBlockParamContract } from './image-block-param-contract';
import { Base64ImageBlockParamStub, UrlImageBlockParamStub } from './image-block-param.stub';

describe('imageBlockParamContract', () => {
  describe('valid input', () => {
    describe('base64 source variant', () => {
      it('VALID: {source.type: "base64", media_type: "image/png"} => returns ImageBlockParam', () => {
        const result = Base64ImageBlockParamStub();

        expect(result).toStrictEqual({
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/png',
            data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          },
        });
      });

      it('VALID: {source.media_type: "image/jpeg"} => accepts jpeg', () => {
        const result = imageBlockParamContract.parse({
          type: 'image',
          source: { type: 'base64', media_type: 'image/jpeg', data: 'abc123' },
        });

        expect(result.source.type).toBe('base64');
      });

      it('VALID: {source.media_type: "image/gif"} => accepts gif', () => {
        const result = imageBlockParamContract.parse({
          type: 'image',
          source: { type: 'base64', media_type: 'image/gif', data: 'abc123' },
        });

        expect(result.source.type).toBe('base64');
      });

      it('VALID: {source.media_type: "image/webp"} => accepts webp', () => {
        const result = imageBlockParamContract.parse({
          type: 'image',
          source: { type: 'base64', media_type: 'image/webp', data: 'abc123' },
        });

        expect(result.source.type).toBe('base64');
      });
    });

    describe('url source variant', () => {
      it('VALID: {source.type: "url"} => returns ImageBlockParam', () => {
        const result = UrlImageBlockParamStub();

        expect(result).toStrictEqual({
          type: 'image',
          source: {
            type: 'url',
            url: 'https://example.com/screenshot.png',
          },
        });
      });
    });
  });

  describe('invalid input', () => {
    it('INVALID: {type: "text"} => throws wrong discriminator', () => {
      expect(() =>
        imageBlockParamContract.parse({
          type: 'text',
          source: { type: 'url', url: 'https://example.com/img.png' },
        }),
      ).toThrow(/Invalid literal value/u);
    });

    it('INVALID: {source missing} => throws on missing required field', () => {
      expect(() => imageBlockParamContract.parse({ type: 'image' })).toThrow(/Required/u);
    });

    it('INVALID: {source.type: "file"} => throws unknown discriminator value', () => {
      expect(() =>
        imageBlockParamContract.parse({
          type: 'image',
          source: { type: 'file', path: '/tmp/img.png' },
        }),
      ).toThrow(/Invalid discriminator value/u);
    });

    it('INVALID: {source.media_type: "application/pdf"} => throws on invalid media_type', () => {
      expect(() =>
        imageBlockParamContract.parse({
          type: 'image',
          source: { type: 'base64', media_type: 'application/pdf', data: 'abc' },
        }),
      ).toThrow(/Invalid enum value/u);
    });
  });
});
