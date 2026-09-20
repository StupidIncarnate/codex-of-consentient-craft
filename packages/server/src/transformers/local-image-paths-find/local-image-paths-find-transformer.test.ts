import { pastedImageStatics } from '@dungeonmaster/shared/statics';

import { localImagePathsFindTransformer } from './local-image-paths-find-transformer';

describe('localImagePathsFindTransformer', () => {
  describe('two paths on one line, one at the very end of the text, one wrapped in parentheses', () => {
    it('VALID: {startOrdinal: 1, message: four paths in mixed positions} => returns all four matches in text order', () => {
      const message =
        'Two right here: /tmp/a.png and /tmp/b.png, then (/tmp/c.png) wrapped, ending with /tmp/d.png';

      const result = localImagePathsFindTransformer({ message, startOrdinal: 1 });

      expect(result).toStrictEqual([
        { path: '/tmp/a.png', matchedText: '/tmp/a.png', ordinal: 1 },
        { path: '/tmp/b.png', matchedText: '/tmp/b.png', ordinal: 2 },
        { path: '/tmp/c.png', matchedText: '/tmp/c.png', ordinal: 3 },
        { path: '/tmp/d.png', matchedText: '/tmp/d.png', ordinal: 4 },
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

  // Every filename below is one a real desktop writes by itself. The scan used to see none of
  // them, so a user who pasted the path of a screenshot they had just taken got the path back as
  // text. `path` is what the copy step will open, so it carries no quotes and no escapes;
  // `matchedText` is what the rewrite step will cut out, so it carries both.
  describe('a screenshot filename holding spaces', () => {
    it("VALID: {macOS's own name, backslash-escaped} => path is unescaped, matchedText keeps the escapes", () => {
      const message = 'Look at /tmp/Screenshot\\ 2026-09-20\\ at\\ 10.30.45\\ AM.png please';

      const result = localImagePathsFindTransformer({ message, startOrdinal: 1 });

      expect(result).toStrictEqual([
        {
          path: '/tmp/Screenshot 2026-09-20 at 10.30.45 AM.png',
          matchedText: '/tmp/Screenshot\\ 2026-09-20\\ at\\ 10.30.45\\ AM.png',
          ordinal: 1,
        },
      ]);
    });

    it("VALID: {GNOME's own name, double-quoted} => path drops the quotes, matchedText keeps them", () => {
      const message = 'Look at "/tmp/Screenshot from 2026-09-20 12-00-00.png" please';

      const result = localImagePathsFindTransformer({ message, startOrdinal: 1 });

      expect(result).toStrictEqual([
        {
          path: '/tmp/Screenshot from 2026-09-20 12-00-00.png',
          matchedText: '"/tmp/Screenshot from 2026-09-20 12-00-00.png"',
          ordinal: 1,
        },
      ]);
    });

    it('VALID: {a single-quoted path} => path drops the quotes, matchedText keeps them', () => {
      const message = "Look at '/tmp/Screen Shot.png' please";

      const result = localImagePathsFindTransformer({ message, startOrdinal: 1 });

      expect(result).toStrictEqual([
        {
          path: '/tmp/Screen Shot.png',
          matchedText: "'/tmp/Screen Shot.png'",
          ordinal: 1,
        },
      ]);
    });

    it('EDGE: {a bare path holding REAL unescaped spaces} => returns no matches, since nothing bounds it', () => {
      const message = 'Look at /tmp/Screen Shot.png please';

      const result = localImagePathsFindTransformer({ message, startOrdinal: 1 });

      expect(result).toStrictEqual([]);
    });

    it('EDGE: {a quoted path already inside a written token} => returns no matches', () => {
      const message = '![Pasted Image 1]("/tmp/Screen Shot.png")';

      const result = localImagePathsFindTransformer({ message, startOrdinal: 1 });

      expect(result).toStrictEqual([]);
    });
  });

  // The serve route lowercases an extension before it reads its content-type map, so it answers a
  // `.PNG` happily. A case-sensitive scan meant the two sides disagreed over nothing but capitals.
  describe('an uppercase extension', () => {
    it('VALID: {message: "/tmp/UPPER.PNG"} => matches', () => {
      const message = 'Look at /tmp/UPPER.PNG please';

      const result = localImagePathsFindTransformer({ message, startOrdinal: 1 });

      expect(result).toStrictEqual([
        { path: '/tmp/UPPER.PNG', matchedText: '/tmp/UPPER.PNG', ordinal: 1 },
      ]);
    });

    it('VALID: {a mixed-case .JpEg} => matches', () => {
      const message = 'Look at /tmp/odd.JpEg please';

      const result = localImagePathsFindTransformer({ message, startOrdinal: 1 });

      expect(result).toStrictEqual([
        { path: '/tmp/odd.JpEg', matchedText: '/tmp/odd.JpEg', ordinal: 1 },
      ]);
    });
  });

  describe('ordinal numbering', () => {
    it('VALID: {startOrdinal: 3, message: one path} => the match carries ordinal 3', () => {
      const message = '/tmp/only.png';

      const result = localImagePathsFindTransformer({ message, startOrdinal: 3 });

      expect(result).toStrictEqual([
        { path: '/tmp/only.png', matchedText: '/tmp/only.png', ordinal: 3 },
      ]);
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
