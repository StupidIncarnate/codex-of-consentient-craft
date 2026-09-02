import { pastedImageStatics } from '@dungeonmaster/shared/statics';

import { imageDataUrlContract } from './image-data-url-contract';
import { ImageDataUrlStub } from './image-data-url.stub';

describe('imageDataUrlContract', () => {
  describe('valid inputs', () => {
    it.each(pastedImageStatics.allowedMediaTypes)(
      'VALID: {mediaType: %s} => parses',
      (mediaType) => {
        const dataUrl = `data:${mediaType};base64,iVBORw0KGgo=`;

        const result = imageDataUrlContract.parse(dataUrl);

        expect(result).toBe(dataUrl);
      },
    );
  });

  describe('invalid inputs', () => {
    it('INVALID: {value: "data:image/bmp;base64,iVBORw0KGgo="} => throws for disallowed media type', () => {
      expect(() => imageDataUrlContract.parse('data:image/bmp;base64,iVBORw0KGgo=')).toThrow(
        /invalid_string/u,
      );
    });

    it('INVALID: {value: "http://example.com/image.png"} => throws for plain http url', () => {
      expect(() => imageDataUrlContract.parse('http://example.com/image.png')).toThrow(
        /invalid_string/u,
      );
    });

    it('INVALID: {value: "data:image/png;base64,"} => throws for missing base64 payload', () => {
      expect(() => imageDataUrlContract.parse('data:image/png;base64,')).toThrow(/invalid_string/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid image data url', () => {
      const result = ImageDataUrlStub();

      expect(result).toBe('data:image/png;base64,iVBORw0KGgo=');
    });

    it('VALID: {value: custom data url} => creates with custom value', () => {
      const result = ImageDataUrlStub({ value: 'data:image/gif;base64,iVBORw0KGgo=' });

      expect(result).toBe('data:image/gif;base64,iVBORw0KGgo=');
    });
  });
});
