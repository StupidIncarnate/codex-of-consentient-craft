import { pastedImageUploadContract } from './pasted-image-upload-contract';
import { PastedImageUploadStub } from './pasted-image-upload.stub';
import { pastedImageStatics } from '../../statics/pasted-image/pasted-image-statics';
import { PastedImageMediaTypeStub } from '../pasted-image-media-type/pasted-image-media-type.stub';

describe('pastedImageUploadContract', () => {
  describe('valid uploads', () => {
    it('VALID: {mediaType: "image/png", dataBase64: "iVBORw0KGgo="} => parses successfully', () => {
      const result = pastedImageUploadContract.parse(PastedImageUploadStub());

      expect(result).toStrictEqual({
        mediaType: 'image/png',
        dataBase64: 'iVBORw0KGgo=',
      });
    });
  });

  describe('invalid uploads', () => {
    it('INVALID: {mediaType: "image/svg+xml"} => throws validation error', () => {
      expect(() =>
        pastedImageUploadContract.parse({
          mediaType: 'image/svg+xml',
          dataBase64: 'iVBORw0KGgo=',
        } as never),
      ).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {dataBase64: "not base64!"} => throws validation error', () => {
      expect(() =>
        pastedImageUploadContract.parse({
          mediaType: PastedImageMediaTypeStub(),
          dataBase64: 'not base64!',
        } as never),
      ).toThrow(/invalid_string/u);
    });
  });

  describe('empty uploads', () => {
    it('EMPTY: {dataBase64: ""} => throws validation error', () => {
      expect(() =>
        pastedImageUploadContract.parse({
          mediaType: PastedImageMediaTypeStub(),
          dataBase64: '',
        } as never),
      ).toThrow(/too_small/u);
    });
  });

  describe('edge cases', () => {
    it('EDGE: dataBase64 decoding over the byte ceiling => throws validation error', () => {
      const overCeiling = 'A'.repeat(
        Math.ceil(((pastedImageStatics.maxBytesPerImage + 1) * 4) / 3),
      );
      const expectedMessage = `Decoded image exceeds ${String(pastedImageStatics.maxBytesPerImage)} bytes`;

      expect(() =>
        pastedImageUploadContract.parse({
          mediaType: PastedImageMediaTypeStub(),
          dataBase64: overCeiling,
        } as never),
      ).toThrow(expectedMessage);
    });
  });

  describe('stub', () => {
    it('VALID: PastedImageUploadStub() => returns default pair', () => {
      const result = PastedImageUploadStub();

      expect(result).toStrictEqual({
        mediaType: 'image/png',
        dataBase64: 'iVBORw0KGgo=',
      });
    });

    it('VALID: PastedImageUploadStub({mediaType: "image/gif"}) => returns overridden mediaType', () => {
      const result = PastedImageUploadStub({
        mediaType: PastedImageMediaTypeStub({ value: 'image/gif' }),
      });

      expect(result).toStrictEqual({
        mediaType: 'image/gif',
        dataBase64: 'iVBORw0KGgo=',
      });
    });
  });
});
