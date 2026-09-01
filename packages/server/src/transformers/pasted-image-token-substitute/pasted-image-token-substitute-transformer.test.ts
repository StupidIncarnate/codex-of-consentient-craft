import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { pastedImageTokenSubstituteTransformer } from './pasted-image-token-substitute-transformer';

describe('pastedImageTokenSubstituteTransformer', () => {
  describe('single token, single path', () => {
    it('VALID: {message: "A[Pasted Image 1]B", imagePaths: [one path]} => rewrites the token to markdown carrying that path', () => {
      const imagePath = AbsoluteFilePathStub({ value: '/q/images/x.png' });

      const result = pastedImageTokenSubstituteTransformer({
        message: 'A[Pasted Image 1]B',
        imagePaths: [imagePath],
      });

      expect(result).toBe('A![Pasted Image 1](/q/images/x.png)B');
    });
  });

  describe('two tokens, two paths', () => {
    it('VALID: {message: "[Pasted Image 1] and [Pasted Image 2]", imagePaths: [path1, path2]} => each token carries the path at its own ordinal', () => {
      const firstPath = AbsoluteFilePathStub({ value: '/q/images/a.png' });
      const secondPath = AbsoluteFilePathStub({ value: '/q/images/b.png' });

      const result = pastedImageTokenSubstituteTransformer({
        message: '[Pasted Image 1] and [Pasted Image 2]',
        imagePaths: [firstPath, secondPath],
      });

      expect(result).toBe(
        '![Pasted Image 1](/q/images/a.png) and ![Pasted Image 2](/q/images/b.png)',
      );
    });
  });

  describe('tokens appearing out of ordinal order', () => {
    it('VALID: {message: "[Pasted Image 2] before [Pasted Image 1]", imagePaths: [path1, path2]} => each token maps to the path its ordinal names, not its position in the text', () => {
      const firstPath = AbsoluteFilePathStub({ value: '/q/images/a.png' });
      const secondPath = AbsoluteFilePathStub({ value: '/q/images/b.png' });

      const result = pastedImageTokenSubstituteTransformer({
        message: '[Pasted Image 2] before [Pasted Image 1]',
        imagePaths: [firstPath, secondPath],
      });

      expect(result).toBe(
        '![Pasted Image 2](/q/images/b.png) before ![Pasted Image 1](/q/images/a.png)',
      );
    });
  });

  describe('ordinal past the end of imagePaths', () => {
    it('EDGE: {message: "[Pasted Image 3]", imagePaths: [one path]} => the token is left exactly as it is', () => {
      const onlyPath = AbsoluteFilePathStub({ value: '/q/images/a.png' });

      const result = pastedImageTokenSubstituteTransformer({
        message: '[Pasted Image 3]',
        imagePaths: [onlyPath],
      });

      expect(result).toBe('[Pasted Image 3]');
    });
  });

  describe('already-rewritten token', () => {
    it('EDGE: {message: output of a prior rewrite, imagePaths: the same paths} => running the transformer over its own output changes nothing', () => {
      const imagePath = AbsoluteFilePathStub({ value: '/q/images/x.png' });
      const alreadyRewritten = '![Pasted Image 1](/q/images/x.png)';

      const result = pastedImageTokenSubstituteTransformer({
        message: alreadyRewritten,
        imagePaths: [imagePath],
      });

      expect(result).toBe(alreadyRewritten);
    });
  });

  describe('message with no tokens', () => {
    it('EMPTY: {message: "just plain text", imagePaths: [one path]} => the message is returned unchanged', () => {
      const imagePath = AbsoluteFilePathStub({ value: '/q/images/x.png' });

      const result = pastedImageTokenSubstituteTransformer({
        message: 'just plain text',
        imagePaths: [imagePath],
      });

      expect(result).toBe('just plain text');
    });
  });

  describe('empty imagePaths', () => {
    it('EMPTY: {message: "[Pasted Image 1]", imagePaths: []} => the token is left exactly as it is', () => {
      const result = pastedImageTokenSubstituteTransformer({
        message: '[Pasted Image 1]',
        imagePaths: [],
      });

      expect(result).toBe('[Pasted Image 1]');
    });
  });
});
