import { pastedImageStatics } from './pasted-image-statics';

describe('pastedImageStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(pastedImageStatics).toStrictEqual({
      maxImagesPerMessage: 5,
      maxBytesPerImage: 5_242_880,
      maxLongestEdgePx: 2000,
      minLongestEdgePx: 512,
      jpegQuality: 0.85,
      allowedMediaTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
      allowedExtensions: ['png', 'jpg', 'jpeg', 'gif', 'webp'],
      placeholderPattern: '\\[Pasted Image (\\d+)\\]',
      imageTokenPattern: '!\\[Pasted Image (\\d+)\\]\\(([^)]+)\\)',
      localImagePathPattern:
        '"(/[^"\\n]+\\.(?:png|jpg|jpeg|gif|webp))"' +
        "|'(/[^'\\n]+\\.(?:png|jpg|jpeg|gif|webp))'" +
        '|(/(?:\\\\ |[^\\s()<>"\'])+\\.(?:png|jpg|jpeg|gif|webp))',
      localImagePathPatternFlags: 'giu',
      promptSentinel: '<!-- dungeonmaster:images -->',
      promptInstruction: 'Read every image referenced above before answering.',
      serveRoutePath: '/api/images',
    });
  });

  // The shape assertion above pins the pattern's TEXT. These pin what that text DOES, because the
  // text is a regex and reading one is not the same as knowing what it matches — and because every
  // message below carries a screenshot name a real desktop produces, not a shape invented to fit.
  describe('localImagePathPattern behaviour', () => {
    const MATCH_CASES = [
      ['a bare path with no spaces', 'See /tmp/a.png ok', ['/tmp/a.png']],
      ['an UPPERCASE extension, which the flags fold', 'See /tmp/UPPER.PNG ok', ['/tmp/UPPER.PNG']],
      [
        "macOS's own screenshot name, backslash-escaped",
        'See /tmp/Screenshot\\ 2026-09-20\\ at\\ 10.30.45\\ AM.png ok',
        ['/tmp/Screenshot\\ 2026-09-20\\ at\\ 10.30.45\\ AM.png'],
      ],
      [
        "GNOME's own screenshot name, double-quoted — quotes included in the match",
        'See "/tmp/Screenshot from 2026-09-20 12-00-00.png" ok',
        ['"/tmp/Screenshot from 2026-09-20 12-00-00.png"'],
      ],
      [
        'a single-quoted path holding spaces — quotes included in the match',
        "See '/tmp/Screen Shot.png' ok",
        ["'/tmp/Screen Shot.png'"],
      ],
      [
        'a bare path holding REAL unescaped spaces, which nothing can bound',
        'See /tmp/Screen Shot.png ok',
        [],
      ],
      [
        'a quoted path beside a bare one',
        'A "/tmp/x y.png" B /tmp/z.png C',
        ['"/tmp/x y.png"', '/tmp/z.png'],
      ],
    ] as const;

    it.each(MATCH_CASES)('VALID: {%s} => matches %j', (_name, message, expected) => {
      const found = Array.from(
        message.matchAll(
          new RegExp(
            pastedImageStatics.localImagePathPattern,
            pastedImageStatics.localImagePathPatternFlags,
          ),
        ),
      ).map((match) => match[0]);

      expect(found).toStrictEqual([...expected]);
    });
  });
});
