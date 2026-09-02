import { pastedImageStatics } from '@dungeonmaster/shared/statics';

import { normaliseChatContentTransformer } from './normalise-chat-content-transformer';

describe('normaliseChatContentTransformer', () => {
  describe('optimistic vs transcript parity', () => {
    it('VALID: {content: optimistic composer text} and {content: transcript text with a resolved image URL} => both normalise to the identical bare-placeholder string', () => {
      const optimisticResult = normaliseChatContentTransformer({ content: 'A[Pasted Image 1]B' });
      const transcriptResult = normaliseChatContentTransformer({
        content: 'A![Pasted Image 1](http://host/api/images?path=%2Fp%2Fx.png)B',
      });

      expect(optimisticResult).toBe('A[Pasted Image 1]B');
      expect(transcriptResult).toBe('A[Pasted Image 1]B');
    });

    it('VALID: {content: transcript text with two resolved image URLs} => reduces both tokens to their bare placeholder form in order', () => {
      const result = normaliseChatContentTransformer({
        content:
          'A![Pasted Image 1](http://host/api/images?path=%2Fp%2Fx.png)B![Pasted Image 2](http://host/api/images?path=%2Fp%2Fy.png)C',
      });

      expect(result).toBe('A[Pasted Image 1]B[Pasted Image 2]C');
    });
  });

  describe('images trailer', () => {
    it('VALID: {content: transcript text with the images trailer appended} => normalises to the same string as the same message without the trailer', () => {
      const baseMessage = 'A![Pasted Image 1](http://host/api/images?path=%2Fp%2Fx.png)B';
      const withTrailer = `${baseMessage}\n\n${pastedImageStatics.promptSentinel}\n${pastedImageStatics.promptInstruction}`;

      const withTrailerResult = normaliseChatContentTransformer({ content: withTrailer });
      const withoutTrailerResult = normaliseChatContentTransformer({ content: baseMessage });

      expect(withTrailerResult).toBe('A[Pasted Image 1]B');
      expect(withoutTrailerResult).toBe('A[Pasted Image 1]B');
    });

    it('EDGE: {content: only the images trailer, no message text} => normalises to an empty string', () => {
      const content = `${pastedImageStatics.promptSentinel}\n${pastedImageStatics.promptInstruction}`;

      const result = normaliseChatContentTransformer({ content });

      expect(result).toBe('');
    });
  });

  describe('text-only content', () => {
    it('VALID: {content: plain prose with no image tokens} => normalises to itself unchanged', () => {
      const result = normaliseChatContentTransformer({ content: 'just a plain text message' });

      expect(result).toBe('just a plain text message');
    });

    it('VALID: {content: prose containing parentheses and square brackets but no image token} => normalises to itself unchanged', () => {
      const content = 'See [the docs](https://example.com) for (details)';

      const result = normaliseChatContentTransformer({ content });

      expect(result).toBe('See [the docs](https://example.com) for (details)');
    });
  });

  describe('empty input', () => {
    it('EMPTY: {content: ""} => normalises to an empty string', () => {
      const result = normaliseChatContentTransformer({ content: '' });

      expect(result).toBe('');
    });
  });
});
