import { pastedImageStatics } from '@dungeonmaster/shared/statics';
import { imagePathToUrlTransformer } from './image-path-to-url-transformer';
import { imagePathToUrlTransformerProxy } from './image-path-to-url-transformer.proxy';

const BASE_URL = 'http://dungeonmaster.localhost:3737';

describe('imagePathToUrlTransformer', () => {
  describe('path becomes query url', () => {
    it('VALID: {content: "A![Pasted Image 1](/p/x.png)B"} => rewrites the token to an /api/images query URL', () => {
      imagePathToUrlTransformerProxy();

      const result = imagePathToUrlTransformer({
        content: 'A![Pasted Image 1](/p/x.png)B',
        serverBaseUrl: BASE_URL,
      });

      expect(result).toBe(
        'A![Pasted Image 1](http://dungeonmaster.localhost:3737/api/images?path=%2Fp%2Fx.png)B',
      );
    });
  });

  describe('non-image markdown link in the same message', () => {
    it('VALID: {content: one image token plus a plain markdown link} => rewrites only the image token, leaves the plain link byte-identical', () => {
      imagePathToUrlTransformerProxy();

      const result = imagePathToUrlTransformer({
        content: 'See ![Pasted Image 1](/p/x.png) and read [notes](/p/notes.md)',
        serverBaseUrl: BASE_URL,
      });

      expect(result).toBe(
        'See ![Pasted Image 1](http://dungeonmaster.localhost:3737/api/images?path=%2Fp%2Fx.png) and read [notes](/p/notes.md)',
      );
    });
  });

  describe('special characters in the path get percent-encoded', () => {
    it.each([
      ['a space', '/p/a b.png', '%2Fp%2Fa%20b.png'],
      ['an ampersand', '/p/a&b.png', '%2Fp%2Fa%26b.png'],
      ['a hash', '/p/a#b.png', '%2Fp%2Fa%23b.png'],
      ['a question mark', '/p/a?b.png', '%2Fp%2Fa%3Fb.png'],
      ['a literal percent', '/p/a%b.png', '%2Fp%2Fa%25b.png'],
      ['a plus', '/p/a+b.png', '%2Fp%2Fa%2Bb.png'],
    ])(
      'VALID: {path containing %s} => the query value carries the percent-encoded path',
      (_label, path, encodedPath) => {
        imagePathToUrlTransformerProxy();

        const result = imagePathToUrlTransformer({
          content: `![Pasted Image 1](${path})`,
          serverBaseUrl: BASE_URL,
        });

        expect(result).toBe(
          `![Pasted Image 1](${BASE_URL}${pastedImageStatics.serveRoutePath}?path=${encodedPath})`,
        );
      },
    );
  });

  describe('non-ASCII path', () => {
    it('VALID: {path containing a non-ASCII character} => the query value round-trips back to the original path', () => {
      imagePathToUrlTransformerProxy();
      const path = '/p/café.png';

      const result = imagePathToUrlTransformer({
        content: `![Pasted Image 1](${path})`,
        serverBaseUrl: BASE_URL,
      });

      const [, queryValueWithClosingParen] = result.split('?path=');
      const queryValue = String(queryValueWithClosingParen).slice(0, -1);

      expect(decodeURIComponent(queryValue)).toBe(path);
    });
  });

  describe('two image tokens in one message', () => {
    it('VALID: {content: message with two image tokens} => rewrites both and keeps each ordinal', () => {
      imagePathToUrlTransformerProxy();

      const result = imagePathToUrlTransformer({
        content: 'Compare ![Pasted Image 1](/p/a.png) with ![Pasted Image 2](/p/b.png)',
        serverBaseUrl: BASE_URL,
      });

      expect(result).toBe(
        'Compare ![Pasted Image 1](http://dungeonmaster.localhost:3737/api/images?path=%2Fp%2Fa.png) with ![Pasted Image 2](http://dungeonmaster.localhost:3737/api/images?path=%2Fp%2Fb.png)',
      );
    });
  });

  describe('message with no image token', () => {
    it('VALID: {content: plain text with no image token} => returns the text unchanged', () => {
      imagePathToUrlTransformerProxy();
      const content = 'Just a plain message with no images';

      const result = imagePathToUrlTransformer({ content, serverBaseUrl: BASE_URL });

      expect(result).toBe(content);
    });
  });

  describe('empty content', () => {
    it('EMPTY: {content: ""} => returns an empty string', () => {
      imagePathToUrlTransformerProxy();

      const result = imagePathToUrlTransformer({ content: '', serverBaseUrl: BASE_URL });

      expect(result).toBe('');
    });
  });
});
