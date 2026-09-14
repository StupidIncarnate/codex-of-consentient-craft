import { pastedImageStatics } from '@dungeonmaster/shared/statics';

import { localImagePathsFindTransformer } from './local-image-paths-find-transformer';

describe('localImagePathsFindTransformer', () => {
  describe('two paths on one line, one at the very end of the text, one wrapped in parentheses', () => {
    it('VALID: {startOrdinal: 1, message: four paths in mixed positions} => returns all four matches in text order', () => {
      const message =
        'Two right here: /tmp/a.png and /tmp/b.png, then (/tmp/c.png) wrapped, ending with /tmp/d.png';

      const result = localImagePathsFindTransformer({ message, startOrdinal: 1 });

      expect(result).toStrictEqual([
        { path: '/tmp/a.png', ordinal: 1 },
        { path: '/tmp/b.png', ordinal: 2 },
        { path: '/tmp/c.png', ordinal: 3 },
        { path: '/tmp/d.png', ordinal: 4 },
      ]);
    });
  });

  describe('relative path, bare filename, and URL', () => {
    it('VALID: {message: "./shot.png shot.png https://example.com/a.png"} => returns no matches', () => {
      const message = './shot.png shot.png https://example.com/a.png';

      const result = localImagePathsFindTransformer({ message, startOrdinal: 1 });

      expect(result).toStrictEqual([]);
    });
  });

  describe('path already inside a written image token', () => {
    it('VALID: {message: "![Pasted Image 1](/home/u/a.png)"} => returns no matches', () => {
      const message = '![Pasted Image 1](/home/u/a.png)';

      const result = localImagePathsFindTransformer({ message, startOrdinal: 1 });

      expect(result).toStrictEqual([]);
    });
  });

  describe('ordinal numbering', () => {
    it('VALID: {startOrdinal: 3, message: one path} => the match carries ordinal 3', () => {
      const message = '/tmp/only.png';

      const result = localImagePathsFindTransformer({ message, startOrdinal: 3 });

      expect(result).toStrictEqual([{ path: '/tmp/only.png', ordinal: 3 }]);
    });

    it('EDGE: {startOrdinal: cap + 1, message: one path} => returns no matches because the cap is already reached', () => {
      const message = '/tmp/only.png';

      const result = localImagePathsFindTransformer({
        message,
        startOrdinal: pastedImageStatics.maxImagesPerMessage + 1,
      });

      expect(result).toStrictEqual([]);
    });
  });
});
