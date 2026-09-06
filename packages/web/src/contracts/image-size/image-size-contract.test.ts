import { imageSizeContract } from './image-size-contract';
import { ImageSizeStub } from './image-size.stub';

describe('imageSizeContract', () => {
  describe('valid inputs', () => {
    it('VALID: {widthPx: 2000, heightPx: 1333} => parses a size', () => {
      const result = imageSizeContract.parse({ widthPx: 2000, heightPx: 1333 });

      expect(result).toStrictEqual({ widthPx: 2000, heightPx: 1333 });
    });

    it('VALID: {widthPx: 800, heightPx: 800} => parses a square size', () => {
      const result = imageSizeContract.parse({ widthPx: 800, heightPx: 800 });

      expect(result).toStrictEqual({ widthPx: 800, heightPx: 800 });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {widthPx: 0} => throws for a zero width', () => {
      expect(() => ImageSizeStub({ widthPx: 0 as never })).toThrow(
        /Number must be greater than 0/u,
      );
    });

    it('INVALID: {heightPx: -1} => throws for a negative height', () => {
      expect(() => ImageSizeStub({ heightPx: -1 as never })).toThrow(
        /Number must be greater than 0/u,
      );
    });

    it('INVALID: {widthPx: 1.5} => throws for a non-integer width', () => {
      expect(() => ImageSizeStub({ widthPx: 1.5 as never })).toThrow(/Expected integer/u);
    });

    it('INVALID: {heightPx missing} => throws for a missing heightPx', () => {
      expect(() => imageSizeContract.parse({ widthPx: 2000 } as never)).toThrow(/Required/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid image size with default 2000x1333', () => {
      const result = ImageSizeStub();

      expect(result).toStrictEqual({ widthPx: 2000, heightPx: 1333 });
    });

    it('VALID: {widthPx: 900, heightPx: 900} => creates image size with overridden values', () => {
      const result = ImageSizeStub({ widthPx: 900, heightPx: 900 });

      expect(result).toStrictEqual({ widthPx: 900, heightPx: 900 });
    });
  });
});
