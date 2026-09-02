import { pastedImageStatics } from '@dungeonmaster/shared/statics';
import { PastedImageMediaTypeStub, PastedImageUploadStub } from '@dungeonmaster/shared/contracts';

import { dataUrlBuildTransformer } from './data-url-build-transformer';
import { dataUrlBuildTransformerProxy } from './data-url-build-transformer.proxy';
import { dataUrlSplitTransformer } from '../data-url-split/data-url-split-transformer';
import { ImageDataUrlStub } from '../../contracts/image-data-url/image-data-url.stub';

describe('dataUrlBuildTransformer', () => {
  describe('media types', () => {
    it.each(pastedImageStatics.allowedMediaTypes)(
      'VALID: {mediaType: %s} => builds the full data url',
      (mediaType) => {
        dataUrlBuildTransformerProxy();

        const result = dataUrlBuildTransformer({
          mediaType: PastedImageMediaTypeStub({ value: mediaType }),
          dataBase64: PastedImageUploadStub().dataBase64,
        });

        expect(result).toBe(`data:${mediaType};base64,iVBORw0KGgo=`);
      },
    );
  });

  describe('byte-for-byte payload', () => {
    it('VALID: {payload with +, / and =} => builds the full string byte-for-byte', () => {
      dataUrlBuildTransformerProxy();

      const result = dataUrlBuildTransformer({
        mediaType: PastedImageMediaTypeStub(),
        dataBase64: PastedImageUploadStub({ dataBase64: 'AB+c/D9+f/8A==' }).dataBase64,
      });

      expect(result).toBe('data:image/png;base64,AB+c/D9+f/8A==');
    });
  });

  describe('round trip', () => {
    it('VALID: {upload} => split(build(upload)) returns the same upload', () => {
      dataUrlBuildTransformerProxy();

      const upload = PastedImageUploadStub({ dataBase64: 'AB+c/D9+f/8A==' });

      const result = dataUrlSplitTransformer({ dataUrl: dataUrlBuildTransformer(upload) });

      expect(result).toStrictEqual(upload);
    });

    it('VALID: {dataUrl} => build(split(dataUrl)) returns the same dataUrl', () => {
      dataUrlBuildTransformerProxy();

      const dataUrl = ImageDataUrlStub({ value: 'data:image/gif;base64,AB+c/D9+f/8A==' });

      const result = dataUrlBuildTransformer(dataUrlSplitTransformer({ dataUrl }));

      expect(result).toBe(dataUrl);
    });
  });
});
