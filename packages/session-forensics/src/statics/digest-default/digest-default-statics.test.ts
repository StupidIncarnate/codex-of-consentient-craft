import { digestDefaultStatics } from './digest-default-statics';

describe('digestDefaultStatics', () => {
  describe('full value', () => {
    it('VALID: {} => carries every digest fallback number', () => {
      expect(digestDefaultStatics).toStrictEqual({
        bucketMinutes: 15,
        gapFloorSeconds: 120,
        resultFloorBytes: 20_000,
        maxTextChars: 400,
        grepContextChars: 200,
        thinkingExcerptChars: 4_000,
      });
    });
  });
});
