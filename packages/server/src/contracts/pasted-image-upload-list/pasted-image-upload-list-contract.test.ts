import { PastedImageMediaTypeStub, PastedImageUploadStub } from '@dungeonmaster/shared/contracts';
import { pastedImageStatics } from '@dungeonmaster/shared/statics';

import { pastedImageUploadListContract } from './pasted-image-upload-list-contract';
import { PastedImageUploadListStub } from './pasted-image-upload-list.stub';

describe('pastedImageUploadListContract', () => {
  describe('valid lists', () => {
    it('VALID: {images: []} => parses to empty array', () => {
      const result = pastedImageUploadListContract.parse([]);

      expect(result).toStrictEqual([]);
    });

    it('VALID: {images: [one]} => parses one image', () => {
      const result = pastedImageUploadListContract.parse(PastedImageUploadListStub());

      expect(result).toStrictEqual([
        {
          mediaType: 'image/png',
          dataBase64: 'iVBORw0KGgo=',
        },
      ]);
    });

    it('VALID: {images: maxImagesPerMessage} => parses every image', () => {
      const images = Array.from({ length: pastedImageStatics.maxImagesPerMessage }, () =>
        PastedImageUploadStub(),
      );

      const result = pastedImageUploadListContract.parse(images);

      expect(result).toStrictEqual(
        Array.from({ length: pastedImageStatics.maxImagesPerMessage }, () => ({
          mediaType: 'image/png',
          dataBase64: 'iVBORw0KGgo=',
        })),
      );
    });
  });

  describe('invalid lists', () => {
    it('INVALID: {images: maxImagesPerMessage + 1} => throws validation error', () => {
      const images = Array.from({ length: pastedImageStatics.maxImagesPerMessage + 1 }, () =>
        PastedImageUploadStub(),
      );

      expect(() => pastedImageUploadListContract.parse(images)).toThrow(/too_big/u);
    });

    it('INVALID: {images: [{mediaType: "image/svg+xml"}]} => throws validation error', () => {
      expect(() =>
        pastedImageUploadListContract.parse([
          { mediaType: 'image/svg+xml', dataBase64: 'iVBORw0KGgo=' },
        ] as never),
      ).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {images: [{dataBase64: over byte ceiling}]} => throws validation error', () => {
      const overCeiling = 'A'.repeat(
        Math.ceil(((pastedImageStatics.maxBytesPerImage + 1) * 4) / 3),
      );
      const expectedMessage = `Decoded image exceeds ${String(pastedImageStatics.maxBytesPerImage)} bytes`;

      expect(() =>
        pastedImageUploadListContract.parse([
          { mediaType: PastedImageMediaTypeStub(), dataBase64: overCeiling },
        ] as never),
      ).toThrow(expectedMessage);
    });
  });
});
