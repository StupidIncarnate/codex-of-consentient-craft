import { AttachmentIdStub } from '../../contracts/attachment-id/attachment-id.stub';
import { ComposerSegmentStub } from '../../contracts/composer-segment/composer-segment.stub';
import { composerSerializeTransformer } from '../composer-serialize/composer-serialize-transformer';
import { composerParseDraftTransformer } from './composer-parse-draft-transformer';
import { composerParseDraftTransformerProxy } from './composer-parse-draft-transformer.proxy';

describe('composerParseDraftTransformer', () => {
  describe('no placeholders', () => {
    it('EMPTY: {text: "", attachmentIds: []} => returns no segments', () => {
      composerParseDraftTransformerProxy();

      const result = composerParseDraftTransformer({ text: '', attachmentIds: [] });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {text with no placeholder} => a single text segment', () => {
      composerParseDraftTransformerProxy();

      const result = composerParseDraftTransformer({ text: 'hello world', attachmentIds: [] });

      expect(result).toStrictEqual([{ kind: 'text', text: 'hello world' }]);
    });
  });

  describe('pairing placeholders to attachment ids by position', () => {
    it('VALID: {"A[Pasted Image 1]B" with one id} => text, image, text in order', () => {
      composerParseDraftTransformerProxy();
      const attachmentId = AttachmentIdStub();

      const result = composerParseDraftTransformer({
        text: 'A[Pasted Image 1]B',
        attachmentIds: [attachmentId],
      });

      expect(result).toStrictEqual([
        { kind: 'text', text: 'A' },
        { kind: 'image', attachmentId },
        { kind: 'text', text: 'B' },
      ]);
    });

    it('VALID: {two placeholders around text} => five segments in order', () => {
      composerParseDraftTransformerProxy();
      const firstId = AttachmentIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const secondId = AttachmentIdStub({ value: '3fa85f64-5717-4562-b3fc-2c963f66afa6' });

      const result = composerParseDraftTransformer({
        text: 'A[Pasted Image 1]B[Pasted Image 2]C',
        attachmentIds: [firstId, secondId],
      });

      expect(result).toStrictEqual([
        { kind: 'text', text: 'A' },
        { kind: 'image', attachmentId: firstId },
        { kind: 'text', text: 'B' },
        { kind: 'image', attachmentId: secondId },
        { kind: 'text', text: 'C' },
      ]);
    });

    // The invariant this exists to prove: a zero-length gap between two placeholders must NOT
    // produce a text segment. A bug here would insert an empty text run between the two images.
    it('VALID: {two ADJACENT placeholders} => exactly two image segments, no text segment between them', () => {
      composerParseDraftTransformerProxy();
      const firstId = AttachmentIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const secondId = AttachmentIdStub({ value: '3fa85f64-5717-4562-b3fc-2c963f66afa6' });

      const result = composerParseDraftTransformer({
        text: '[Pasted Image 1][Pasted Image 2]',
        attachmentIds: [firstId, secondId],
      });

      expect(result).toStrictEqual([
        { kind: 'image', attachmentId: firstId },
        { kind: 'image', attachmentId: secondId },
      ]);
    });

    it('VALID: {placeholder at the very start and end} => no leading or trailing empty text segment', () => {
      composerParseDraftTransformerProxy();
      const attachmentId = AttachmentIdStub();

      const result = composerParseDraftTransformer({
        text: '[Pasted Image 1]',
        attachmentIds: [attachmentId],
      });

      expect(result).toStrictEqual([{ kind: 'image', attachmentId }]);
    });

    it('VALID: {whitespace either side of a placeholder} => surrounding whitespace survives exactly', () => {
      composerParseDraftTransformerProxy();
      const attachmentId = AttachmentIdStub();

      const result = composerParseDraftTransformer({
        text: 'a [Pasted Image 1] b',
        attachmentIds: [attachmentId],
      });

      expect(result).toStrictEqual([
        { kind: 'text', text: 'a ' },
        { kind: 'image', attachmentId },
        { kind: 'text', text: ' b' },
      ]);
    });
  });

  describe('mismatched placeholder and attachment id counts', () => {
    it('EDGE: {two placeholders, one id} => the second placeholder stays literal text', () => {
      composerParseDraftTransformerProxy();
      const firstId = AttachmentIdStub();

      const result = composerParseDraftTransformer({
        text: '[Pasted Image 1][Pasted Image 2]',
        attachmentIds: [firstId],
      });

      expect(result).toStrictEqual([
        { kind: 'image', attachmentId: firstId },
        { kind: 'text', text: '[Pasted Image 2]' },
      ]);
    });

    it('EDGE: {one placeholder, two ids} => the second id is dropped', () => {
      composerParseDraftTransformerProxy();
      const firstId = AttachmentIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const secondId = AttachmentIdStub({ value: '3fa85f64-5717-4562-b3fc-2c963f66afa6' });

      const result = composerParseDraftTransformer({
        text: '[Pasted Image 1]',
        attachmentIds: [firstId, secondId],
      });

      expect(result).toStrictEqual([{ kind: 'image', attachmentId: firstId }]);
    });
  });

  // The arithmetic half of #check-restored-draft-serialises-identically: a draft round-trips
  // through save (composerSerializeTransformer) and reload (this transformer) back to the exact
  // segment list it started from. A drift in either transformer's pairing logic shows up here even
  // though each transformer's own tests still pass in isolation.
  describe('round trip through composerSerializeTransformer', () => {
    it('VALID: {segments with two images and surrounding whitespace} => reparses to the identical segment array', () => {
      composerParseDraftTransformerProxy();
      const firstId = AttachmentIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const secondId = AttachmentIdStub({ value: '3fa85f64-5717-4562-b3fc-2c963f66afa6' });
      const originalSegments = [
        ComposerSegmentStub({ kind: 'text', text: 'a ' }),
        ComposerSegmentStub({ kind: 'image', attachmentId: firstId }),
        ComposerSegmentStub({ kind: 'text', text: ' b ' }),
        ComposerSegmentStub({ kind: 'image', attachmentId: secondId }),
        ComposerSegmentStub({ kind: 'text', text: ' c' }),
      ];

      const serialized = composerSerializeTransformer({ segments: originalSegments });
      const result = composerParseDraftTransformer({
        text: serialized.text,
        attachmentIds: serialized.attachmentIds,
      });

      expect(result).toStrictEqual(originalSegments);
    });
  });
});
