import { pastedImageStatics } from '@dungeonmaster/shared/statics';

import { pastedImageDraftContract } from './pasted-image-draft-contract';
import { PastedImageDraftStub } from './pasted-image-draft.stub';

describe('pastedImageDraftContract', () => {
  describe('valid inputs', () => {
    it('VALID: {attachmentId, mediaType, dataBase64} => parses the whole draft record', () => {
      const result = pastedImageDraftContract.parse({
        attachmentId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        mediaType: 'image/png',
        dataBase64: 'iVBORw0KGgo=',
      });

      expect(result).toStrictEqual({
        attachmentId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        mediaType: 'image/png',
        dataBase64: 'iVBORw0KGgo=',
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {attachmentId: "not-a-uuid"} => throws for non-uuid attachmentId', () => {
      expect(() => PastedImageDraftStub({ attachmentId: 'not-a-uuid' as never })).toThrow(
        /Invalid uuid/u,
      );
    });

    it('INVALID: {mediaType: "image/bmp"} => throws for unsupported mediaType', () => {
      expect(() => PastedImageDraftStub({ mediaType: 'image/bmp' as never })).toThrow(
        /Invalid enum value/u,
      );
    });

    it('INVALID: {dataBase64: "not base64!"} => throws for malformed dataBase64', () => {
      expect(() => PastedImageDraftStub({ dataBase64: 'not base64!' as never })).toThrow(
        /invalid_string/u,
      );
    });

    // Proves the byte ceiling arrived intact through pastedImageUploadContract.shape.dataBase64
    // rather than being lost when this contract re-declared the field.
    it('INVALID: {dataBase64 decoding over the byte ceiling} => throws for oversized payload', () => {
      const oversizedLength = Math.ceil(((pastedImageStatics.maxBytesPerImage + 1) * 4) / 3);
      const oversizedBase64 = 'A'.repeat(oversizedLength);

      expect(() => PastedImageDraftStub({ dataBase64: oversizedBase64 as never })).toThrow(
        `Decoded image exceeds ${String(pastedImageStatics.maxBytesPerImage)} bytes`,
      );
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates a draft with the default pair', () => {
      const result = PastedImageDraftStub();

      expect(result).toStrictEqual({
        attachmentId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        mediaType: 'image/png',
        dataBase64: 'iVBORw0KGgo=',
      });
    });

    it('VALID: {mediaType: "image/gif"} => creates a draft with the overridden mediaType', () => {
      const result = PastedImageDraftStub({ mediaType: 'image/gif' });

      expect(result).toStrictEqual({
        attachmentId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        mediaType: 'image/gif',
        dataBase64: 'iVBORw0KGgo=',
      });
    });
  });
});
