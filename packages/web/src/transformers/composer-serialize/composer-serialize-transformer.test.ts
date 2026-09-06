import { pastedImageStatics } from '@dungeonmaster/shared/statics';

import { composerSerializeTransformer } from './composer-serialize-transformer';
import { composerSerializeTransformerProxy } from './composer-serialize-transformer.proxy';
import { ComposerSegmentStub } from '../../contracts/composer-segment/composer-segment.stub';

const FIRST_ATTACHMENT_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
const SECOND_ATTACHMENT_ID = '11111111-1111-4111-8111-111111111111';

describe('composerSerializeTransformer', () => {
  describe('empty input', () => {
    it('EMPTY: {segments: []} => returns empty text and no attachment ids', () => {
      composerSerializeTransformerProxy();

      const result = composerSerializeTransformer({ segments: [] });

      expect(result).toStrictEqual({ text: '', attachmentIds: [] });
    });

    it('EMPTY: {segments: [image, "", image]} => the zero-length text segment contributes nothing between the placeholders', () => {
      composerSerializeTransformerProxy();

      const segments = [
        ComposerSegmentStub({ kind: 'image', attachmentId: FIRST_ATTACHMENT_ID }),
        ComposerSegmentStub({ text: '' }),
        ComposerSegmentStub({ kind: 'image', attachmentId: SECOND_ATTACHMENT_ID }),
      ];

      const result = composerSerializeTransformer({ segments });

      expect(result).toStrictEqual({
        text: '[Pasted Image 1][Pasted Image 2]',
        attachmentIds: [FIRST_ATTACHMENT_ID, SECOND_ATTACHMENT_ID],
      });
    });
  });

  describe('text-only segments', () => {
    it('VALID: {segments: [text segment]} => returns that text verbatim with no attachment ids', () => {
      composerSerializeTransformerProxy();

      const segments = [ComposerSegmentStub({ text: 'hello there' })];

      const result = composerSerializeTransformer({ segments });

      expect(result).toStrictEqual({ text: 'hello there', attachmentIds: [] });
    });
  });

  describe('image segments', () => {
    it('VALID: {segments: [text, image, text]} => places the ordinal-1 placeholder between the two text runs and carries the one attachment id', () => {
      composerSerializeTransformerProxy();

      const segments = [
        ComposerSegmentStub({ text: 'A' }),
        ComposerSegmentStub({ kind: 'image', attachmentId: FIRST_ATTACHMENT_ID }),
        ComposerSegmentStub({ text: 'B' }),
      ];

      const result = composerSerializeTransformer({ segments });

      expect(result).toStrictEqual({
        text: 'A[Pasted Image 1]B',
        attachmentIds: [FIRST_ATTACHMENT_ID],
      });
    });

    it('VALID: {segments: [text, image, text, image, text]} => numbers each placeholder by position and carries both attachment ids in left-to-right order', () => {
      composerSerializeTransformerProxy();

      const segments = [
        ComposerSegmentStub({ text: 'A' }),
        ComposerSegmentStub({ kind: 'image', attachmentId: FIRST_ATTACHMENT_ID }),
        ComposerSegmentStub({ text: 'B' }),
        ComposerSegmentStub({ kind: 'image', attachmentId: SECOND_ATTACHMENT_ID }),
        ComposerSegmentStub({ text: 'C' }),
      ];

      const result = composerSerializeTransformer({ segments });

      expect(result).toStrictEqual({
        text: 'A[Pasted Image 1]B[Pasted Image 2]C',
        attachmentIds: [FIRST_ATTACHMENT_ID, SECOND_ATTACHMENT_ID],
      });
    });

    it('VALID: {segments: [image, image]} => places both placeholders back to back with no separator', () => {
      composerSerializeTransformerProxy();

      const segments = [
        ComposerSegmentStub({ kind: 'image', attachmentId: FIRST_ATTACHMENT_ID }),
        ComposerSegmentStub({ kind: 'image', attachmentId: SECOND_ATTACHMENT_ID }),
      ];

      const result = composerSerializeTransformer({ segments });

      expect(result).toStrictEqual({
        text: '[Pasted Image 1][Pasted Image 2]',
        attachmentIds: [FIRST_ATTACHMENT_ID, SECOND_ATTACHMENT_ID],
      });
    });

    it('VALID: {segments: ["a ", image]} => keeps the trailing space the user typed before the placeholder', () => {
      composerSerializeTransformerProxy();

      const segments = [
        ComposerSegmentStub({ text: 'a ' }),
        ComposerSegmentStub({ kind: 'image', attachmentId: FIRST_ATTACHMENT_ID }),
      ];

      const result = composerSerializeTransformer({ segments });

      expect(result).toStrictEqual({
        text: 'a [Pasted Image 1]',
        attachmentIds: [FIRST_ATTACHMENT_ID],
      });
    });

    it('VALID: {segments: [image, " b"]} => keeps the leading space the user typed after the placeholder', () => {
      composerSerializeTransformerProxy();

      const segments = [
        ComposerSegmentStub({ kind: 'image', attachmentId: FIRST_ATTACHMENT_ID }),
        ComposerSegmentStub({ text: ' b' }),
      ];

      const result = composerSerializeTransformer({ segments });

      expect(result).toStrictEqual({
        text: '[Pasted Image 1] b',
        attachmentIds: [FIRST_ATTACHMENT_ID],
      });
    });
  });

  // check-same-clipboard-twice-numbered-in-order: pasting the same clipboard bytes twice mints two
  // DIFFERENT attachment ids (the composer never dedupes by content), so this proves the ordinal
  // that numbers each placeholder tracks POSITION, not identity — two byte-identical pastes still
  // read as "1" then "2", never "1" twice. Asserted as one toStrictEqual on the whole result so the
  // exact string AND the exact id order are both pinned in a single, bleedthrough-proof check.
  it('VALID: check-same-clipboard-twice-numbered-in-order — {segments: [text, image, image]} with two pastes of identical bytes carrying different attachment ids => serialises to "text[Pasted Image 1][Pasted Image 2]" and keeps both ids in paste order', () => {
    composerSerializeTransformerProxy();

    const segments = [
      ComposerSegmentStub({ text: 'text' }),
      ComposerSegmentStub({ kind: 'image', attachmentId: FIRST_ATTACHMENT_ID }),
      ComposerSegmentStub({ kind: 'image', attachmentId: SECOND_ATTACHMENT_ID }),
    ];

    const result = composerSerializeTransformer({ segments });

    expect(result).toStrictEqual({
      text: 'text[Pasted Image 1][Pasted Image 2]',
      attachmentIds: [FIRST_ATTACHMENT_ID, SECOND_ATTACHMENT_ID],
    });
  });

  describe('server placeholder contract', () => {
    // This is the assertion that fails if either side's token format drifts: this transformer
    // writes the `[Pasted Image N]` literal, and pastedImageStatics.placeholderPattern is the
    // server's own regex for the same token, authored independently in a different package. Nothing
    // else in the type system ties them together — only this test does.
    it("VALID: {segments: [one image]} => the single-image placeholder matches the server's placeholderPattern regex", () => {
      composerSerializeTransformerProxy();

      const segments = [ComposerSegmentStub({ kind: 'image', attachmentId: FIRST_ATTACHMENT_ID })];

      const { text } = composerSerializeTransformer({ segments });

      expect(new RegExp(`^${pastedImageStatics.placeholderPattern}$`, 'u').test(text)).toBe(true);
    });
  });
});
