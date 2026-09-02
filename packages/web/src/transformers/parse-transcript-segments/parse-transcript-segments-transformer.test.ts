import { pastedImageStatics } from '@dungeonmaster/shared/statics';

import { ImageDataUrlStub } from '../../contracts/image-data-url/image-data-url.stub';
import { parseTranscriptSegmentsTransformer } from './parse-transcript-segments-transformer';

describe('parseTranscriptSegmentsTransformer', () => {
  describe('composed order across two image tokens', () => {
    it('VALID: {content: two markdown image tokens between sentence halves} => text, image ordinal 1, text, image ordinal 2, text in composed order', () => {
      const result = parseTranscriptSegmentsTransformer({
        content:
          'this image A ![Pasted Image 1](http://host/api/images?path=%2Fp%2Fa.png) vs this image B ![Pasted Image 2](http://host/api/images?path=%2Fp%2Fb.png) end',
      });

      expect(result).toStrictEqual([
        { kind: 'text', text: 'this image A ' },
        { kind: 'image', ordinal: 1, src: 'http://host/api/images?path=%2Fp%2Fa.png' },
        { kind: 'text', text: ' vs this image B ' },
        { kind: 'image', ordinal: 2, src: 'http://host/api/images?path=%2Fp%2Fb.png' },
        { kind: 'text', text: ' end' },
      ]);
    });
  });

  describe('single image token between two text halves', () => {
    it('VALID: {content: "A" + image token + "B"} => text A, image, text B in that composed order', () => {
      const result = parseTranscriptSegmentsTransformer({
        content: 'A![Pasted Image 1](http://host/api/images?path=%2Fp%2Fx.png)B',
      });

      expect(result).toStrictEqual([
        { kind: 'text', text: 'A' },
        { kind: 'image', ordinal: 1, src: 'http://host/api/images?path=%2Fp%2Fx.png' },
        { kind: 'text', text: 'B' },
      ]);
    });
  });

  describe('markdown image token src', () => {
    it('VALID: {content: a single markdown image token} => the image segment src is the exact URL from the token parentheses', () => {
      const result = parseTranscriptSegmentsTransformer({
        content: 'see ![Pasted Image 1](http://host/api/images?path=%2Fp%2Fx.png) here',
      });

      expect(result).toStrictEqual([
        { kind: 'text', text: 'see ' },
        { kind: 'image', ordinal: 1, src: 'http://host/api/images?path=%2Fp%2Fx.png' },
        { kind: 'text', text: ' here' },
      ]);
    });
  });

  describe('images trailer', () => {
    it('VALID: {content: message followed by the images trailer} => the trailer contributes nothing to the returned segments', () => {
      const withTrailer = `before ![Pasted Image 1](http://host/api/images?path=%2Fp%2Fx.png) after\n\n${pastedImageStatics.promptSentinel}\n${pastedImageStatics.promptInstruction}`;

      const result = parseTranscriptSegmentsTransformer({ content: withTrailer });

      expect(result).toStrictEqual([
        { kind: 'text', text: 'before ' },
        { kind: 'image', ordinal: 1, src: 'http://host/api/images?path=%2Fp%2Fx.png' },
        { kind: 'text', text: ' after\n\n' },
      ]);
    });
  });

  describe('bare placeholder resolved from memory', () => {
    it('VALID: {content: a bare placeholder, memoryImages carrying its bytes} => resolves to the in-memory data URL', () => {
      const dataUrl = ImageDataUrlStub();

      const result = parseTranscriptSegmentsTransformer({
        content: 'A[Pasted Image 1]B',
        memoryImages: [dataUrl],
      });

      expect(result).toStrictEqual([
        { kind: 'text', text: 'A' },
        { kind: 'image', ordinal: 1, src: dataUrl },
        { kind: 'text', text: 'B' },
      ]);
    });
  });

  describe('bare placeholder with no recovered bytes', () => {
    it('EDGE: {content: a bare placeholder, no memoryImages} => no image segment and no leftover placeholder text', () => {
      const result = parseTranscriptSegmentsTransformer({ content: 'A[Pasted Image 1]B' });

      expect(result).toStrictEqual([
        { kind: 'text', text: 'A' },
        { kind: 'text', text: 'B' },
      ]);
    });
  });

  // Proves the combined alternation's group offsets: imageTokenPattern owns groups 1-2, so
  // placeholderPattern's own ordinal group lands at 3 once appended. Mixing both forms in one
  // message, at ordinals 1 and 2 respectively, is what a mis-numbered offset cannot pass — each
  // ordinal would resolve through the wrong form's extraction path.
  describe('mixed markdown token and bare placeholder in one message', () => {
    it('VALID: {content: an image token at ordinal 1 followed by a bare placeholder at ordinal 2} => each ordinal resolves through its own form', () => {
      const dataUrl = ImageDataUrlStub({ value: 'data:image/png;base64,BBBB' });

      const result = parseTranscriptSegmentsTransformer({
        content: 'A![Pasted Image 1](http://host/api/images?path=%2Fp%2Fa.png)B[Pasted Image 2]C',
        memoryImages: [ImageDataUrlStub(), dataUrl],
      });

      expect(result).toStrictEqual([
        { kind: 'text', text: 'A' },
        { kind: 'image', ordinal: 1, src: 'http://host/api/images?path=%2Fp%2Fa.png' },
        { kind: 'text', text: 'B' },
        { kind: 'image', ordinal: 2, src: dataUrl },
        { kind: 'text', text: 'C' },
      ]);
    });
  });

  // The invariant this exists to prove: a zero-length gap between two matches must NOT produce a
  // text segment. A bug here would insert an empty text run between the two images.
  describe('adjacent image tokens with no text between them', () => {
    it('VALID: {content: two adjacent markdown image tokens} => exactly two image segments, no empty text segment between them', () => {
      const result = parseTranscriptSegmentsTransformer({
        content:
          '![Pasted Image 1](http://host/api/images?path=%2Fp%2Fa.png)![Pasted Image 2](http://host/api/images?path=%2Fp%2Fb.png)',
      });

      expect(result).toStrictEqual([
        { kind: 'image', ordinal: 1, src: 'http://host/api/images?path=%2Fp%2Fa.png' },
        { kind: 'image', ordinal: 2, src: 'http://host/api/images?path=%2Fp%2Fb.png' },
      ]);
    });
  });

  describe('text-only content', () => {
    it('VALID: {content: plain prose with no image tokens} => a single text segment holding the original string', () => {
      const result = parseTranscriptSegmentsTransformer({ content: 'just a plain text message' });

      expect(result).toStrictEqual([{ kind: 'text', text: 'just a plain text message' }]);
    });

    it('VALID: {content: prose containing parentheses and square brackets but no image token} => stays one text segment', () => {
      const content = 'See [the docs](https://example.com) for (details)';

      const result = parseTranscriptSegmentsTransformer({ content });

      expect(result).toStrictEqual([{ kind: 'text', text: content }]);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {content: ""} => returns an empty array', () => {
      const result = parseTranscriptSegmentsTransformer({ content: '' });

      expect(result).toStrictEqual([]);
    });
  });
});
