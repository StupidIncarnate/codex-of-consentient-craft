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
      promptSentinel: '<!-- dungeonmaster:images -->',
      promptInstruction: 'Read every image referenced above before answering.',
    });
  });
});
