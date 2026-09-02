import { pastedImageStatics } from '@dungeonmaster/shared/statics';

import { dataUrlSplitTransformer } from './data-url-split-transformer';
import { dataUrlSplitTransformerProxy } from './data-url-split-transformer.proxy';
import { ImageDataUrlStub } from '../../contracts/image-data-url/image-data-url.stub';

describe('dataUrlSplitTransformer', () => {
  describe('media types', () => {
    it.each(pastedImageStatics.allowedMediaTypes)(
      'VALID: {mediaType: %s} => splits',
      (mediaType) => {
        dataUrlSplitTransformerProxy();

        const dataUrl = ImageDataUrlStub({
          value: `data:${mediaType};base64,iVBORw0KGgo=`,
        });

        const result = dataUrlSplitTransformer({ dataUrl });

        expect(result).toStrictEqual({ mediaType, dataBase64: 'iVBORw0KGgo=' });
      },
    );
  });

  describe('byte-for-byte payload', () => {
    it('VALID: {payload with +, / and trailing =} => survives byte-for-byte', () => {
      dataUrlSplitTransformerProxy();

      const dataUrl = ImageDataUrlStub({
        value: 'data:image/png;base64,AB+c/D9+f/8A==',
      });

      const result = dataUrlSplitTransformer({ dataUrl });

      expect(result).toStrictEqual({ mediaType: 'image/png', dataBase64: 'AB+c/D9+f/8A==' });
    });
  });

  describe('byte ceiling', () => {
    it('INVALID: {payload decoding over maxBytesPerImage} => throws', () => {
      dataUrlSplitTransformerProxy();

      const overCeiling = 'A'.repeat(
        Math.ceil(((pastedImageStatics.maxBytesPerImage + 1) * 4) / 3),
      );
      const dataUrl = ImageDataUrlStub({
        value: `data:image/png;base64,${overCeiling}`,
      });

      expect(() => dataUrlSplitTransformer({ dataUrl })).toThrow(
        `Decoded image exceeds ${String(pastedImageStatics.maxBytesPerImage)} bytes`,
      );
    });
  });
});
