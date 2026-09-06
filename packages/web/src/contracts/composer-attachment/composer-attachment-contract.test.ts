import { pastedImageStatics } from '@dungeonmaster/shared/statics';

import { composerAttachmentContract } from './composer-attachment-contract';
import { ComposerAttachmentStub } from './composer-attachment.stub';

describe('composerAttachmentContract', () => {
  describe('valid inputs', () => {
    it('VALID: {attachmentId, mediaType, dataUrl, byteLength, widthPx, heightPx} => parses successfully', () => {
      const result = composerAttachmentContract.parse({
        attachmentId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        mediaType: 'image/png',
        dataUrl: 'data:image/png;base64,iVBORw0KGgo=',
        byteLength: 1024,
        widthPx: 2000,
        heightPx: 1333,
      });

      expect(result).toStrictEqual({
        attachmentId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        mediaType: 'image/png',
        dataUrl: 'data:image/png;base64,iVBORw0KGgo=',
        byteLength: 1024,
        widthPx: 2000,
        heightPx: 1333,
      });
    });

    it('EDGE: {byteLength: pastedImageStatics.maxBytesPerImage} => parses at the byte ceiling', () => {
      const result = ComposerAttachmentStub({ byteLength: pastedImageStatics.maxBytesPerImage });

      expect(result).toStrictEqual({
        attachmentId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        mediaType: 'image/png',
        dataUrl: 'data:image/png;base64,iVBORw0KGgo=',
        byteLength: pastedImageStatics.maxBytesPerImage,
        widthPx: 2000,
        heightPx: 1333,
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {byteLength: maxBytesPerImage + 1} => throws for exceeding the byte ceiling', () => {
      expect(() =>
        ComposerAttachmentStub({
          byteLength: (pastedImageStatics.maxBytesPerImage + 1) as never,
        }),
      ).toThrow(`Decoded image exceeds ${String(pastedImageStatics.maxBytesPerImage)} bytes`);
    });

    it('INVALID: {mediaType: "image/bmp"} => throws for a media type outside the allowed set', () => {
      expect(() => ComposerAttachmentStub({ mediaType: 'image/bmp' as never })).toThrow(
        "Invalid enum value. Expected 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp', received 'image/bmp'",
      );
    });

    it('INVALID: {dataUrl: "https://example.com/a.png"} => throws for a non-data-url', () => {
      expect(() =>
        ComposerAttachmentStub({ dataUrl: 'https://example.com/a.png' as never }),
      ).toThrow(/invalid_string/u);
    });

    it('INVALID: {widthPx: 0} => throws for a non-positive width', () => {
      expect(() => ComposerAttachmentStub({ widthPx: 0 as never })).toThrow(
        /Number must be greater than 0/u,
      );
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid composer attachment', () => {
      const result = ComposerAttachmentStub();

      expect(result).toStrictEqual({
        attachmentId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        mediaType: 'image/png',
        dataUrl: 'data:image/png;base64,iVBORw0KGgo=',
        byteLength: 1024,
        widthPx: 2000,
        heightPx: 1333,
      });
    });

    it('VALID: {byteLength: 2048} => creates composer attachment with custom byteLength', () => {
      const result = ComposerAttachmentStub({ byteLength: 2048 });

      expect(result).toStrictEqual({
        attachmentId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        mediaType: 'image/png',
        dataUrl: 'data:image/png;base64,iVBORw0KGgo=',
        byteLength: 2048,
        widthPx: 2000,
        heightPx: 1333,
      });
    });
  });
});
