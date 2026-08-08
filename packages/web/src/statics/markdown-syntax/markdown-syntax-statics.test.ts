import { markdownSyntaxStatics } from './markdown-syntax-statics';

describe('markdownSyntaxStatics', () => {
  describe('shape', () => {
    it('VALID: {statics} => exposes the heading bounds, fence, bullet glyph, and indent clamp', () => {
      expect(markdownSyntaxStatics).toStrictEqual({
        minHeadingLevel: 1,
        maxHeadingLevel: 6,
        codeFence: '```',
        bulletGlyph: '•',
        indentWidth: 2,
        maxListDepth: 3,
      });
    });
  });
});
