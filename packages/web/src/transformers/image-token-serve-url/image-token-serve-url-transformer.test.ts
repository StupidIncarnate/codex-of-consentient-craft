import { imageTokenServeUrlTransformer } from './image-token-serve-url-transformer';

describe('imageTokenServeUrlTransformer', () => {
  describe('a token carrying a raw filesystem path', () => {
    it('VALID: {one token} => the path moves into a percent-encoded serve-route query', () => {
      const result = imageTokenServeUrlTransformer({
        content: 'Look at ![Pasted Image 1](/q/images/a.png) please',
      });

      expect(result).toBe(
        'Look at ![Pasted Image 1](/api/images?path=%2Fq%2Fimages%2Fa.png) please',
      );
    });

    it('VALID: {two tokens} => each is resolved and keeps its own ordinal', () => {
      const result = imageTokenServeUrlTransformer({
        content: '![Pasted Image 1](/q/images/a.png) then ![Pasted Image 2](/q/images/b.jpg)',
      });

      expect(result).toBe(
        '![Pasted Image 1](/api/images?path=%2Fq%2Fimages%2Fa.png) then ' +
          '![Pasted Image 2](/api/images?path=%2Fq%2Fimages%2Fb.jpg)',
      );
    });

    // The whole point of encoding: a path holding a space or a `#` would otherwise cut the query
    // short, and the route would be handed a path the file is not at.
    it('EDGE: {a path holding a space and a hash} => both are encoded rather than ending the query', () => {
      const result = imageTokenServeUrlTransformer({
        content: '![Pasted Image 1](/q/images/Screen Shot #2.png)',
      });

      expect(result).toBe(
        '![Pasted Image 1](/api/images?path=%2Fq%2Fimages%2FScreen%20Shot%20%232.png)',
      );
    });
  });

  describe('a token already pointing at a URL', () => {
    it('VALID: {an absolute http URL} => is left byte for byte as it was', () => {
      const content =
        'A ![Pasted Image 1](http://dungeonmaster.localhost:3737/api/images?path=%2Fq%2Fa.png) B';

      const result = imageTokenServeUrlTransformer({ content });

      expect(result).toBe(content);
    });

    it('VALID: {a root-relative serve-route URL} => is left byte for byte as it was', () => {
      const content = 'A ![Pasted Image 1](/api/images?path=%2Fq%2Fa.png) B';

      const result = imageTokenServeUrlTransformer({ content });

      expect(result).toBe(content);
    });

    // Running this twice must land where running it once did. Without the already-a-URL guard the
    // second pass would encode the first pass's encoding, and the route would read `%2F` as text.
    it('VALID: {applied twice} => the second pass changes nothing the first pass produced', () => {
      const once = imageTokenServeUrlTransformer({
        content: 'Look at ![Pasted Image 1](/q/images/a.png)',
      });

      const twice = imageTokenServeUrlTransformer({ content: once });

      expect(twice).toBe('Look at ![Pasted Image 1](/api/images?path=%2Fq%2Fimages%2Fa.png)');
    });

    it('VALID: {a data URL} => is left byte for byte as it was', () => {
      const content = 'A ![Pasted Image 1](data:image/png;base64,iVBORw0KGgo=) B';

      const result = imageTokenServeUrlTransformer({ content });

      expect(result).toBe(content);
    });
  });

  describe('text carrying no token', () => {
    it('VALID: {plain prose} => comes back unchanged', () => {
      const result = imageTokenServeUrlTransformer({ content: 'Add login with OAuth' });

      expect(result).toBe('Add login with OAuth');
    });

    // A bare placeholder is not a token — nothing has resolved it to a path, so there is nothing
    // here to point anywhere. The renderer downstream turns it into a broken-image box instead.
    it('VALID: {a bare [Pasted Image 1] placeholder} => comes back unchanged', () => {
      const result = imageTokenServeUrlTransformer({ content: 'before [Pasted Image 1] after' });

      expect(result).toBe('before [Pasted Image 1] after');
    });

    it('EMPTY: {content: ""} => returns the empty string', () => {
      const result = imageTokenServeUrlTransformer({ content: '' });

      expect(result).toBe('');
    });
  });
});
