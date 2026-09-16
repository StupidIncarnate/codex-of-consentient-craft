import { pixelmatchCompareAdapter } from './pixelmatch-compare-adapter';
import { pixelmatchCompareAdapterProxy } from './pixelmatch-compare-adapter.proxy';
import { DecodedFrameStub } from '../../../contracts/decoded-frame/decoded-frame.stub';
import { perceptionStatics } from '../../../statics/perception/perception-statics';

describe('pixelmatchCompareAdapter', () => {
  describe('identical frames', () => {
    it('VALID: {two identical 2x2 white frames} => returns 0', () => {
      pixelmatchCompareAdapterProxy();
      const pixels = new Uint8Array(16).fill(255);
      const before = DecodedFrameStub({ width: 2, height: 2, pixels });
      const after = DecodedFrameStub({ width: 2, height: 2, pixels: new Uint8Array(pixels) });

      const result = pixelmatchCompareAdapter({ before, after });

      expect(result).toBe(0);
    });
  });

  describe('differing frames', () => {
    it('VALID: {3 of 16 pixels differ on a 4x4 frame} => returns 3', () => {
      pixelmatchCompareAdapterProxy();
      const before = DecodedFrameStub({
        width: 4,
        height: 4,
        pixels: new Uint8Array(64).fill(255),
      });
      const afterPixels = new Uint8Array(64).fill(255);
      // Three isolated pixels turned black: flat index 0 (corner), 6 (interior), 15 (corner).
      afterPixels[0] = 0;
      afterPixels[1] = 0;
      afterPixels[2] = 0;
      afterPixels[24] = 0;
      afterPixels[25] = 0;
      afterPixels[26] = 0;
      afterPixels[60] = 0;
      afterPixels[61] = 0;
      afterPixels[62] = 0;
      const after = DecodedFrameStub({ width: 4, height: 4, pixels: afterPixels });

      const result = pixelmatchCompareAdapter({ before, after });

      expect(result).toBe(3);
    });
  });

  describe('options passed to pixelmatch', () => {
    it('VALID: {two identical 2x2 white frames} => calls pixelmatch with the perception threshold and includeAA:false', () => {
      const proxy = pixelmatchCompareAdapterProxy();
      const before = DecodedFrameStub({
        width: 2,
        height: 2,
        pixels: new Uint8Array(16).fill(255),
      });
      const after = DecodedFrameStub({ width: 2, height: 2, pixels: new Uint8Array(16).fill(255) });

      pixelmatchCompareAdapter({ before, after });

      expect(proxy.getCalls()).toStrictEqual([
        [
          before.pixels,
          after.pixels,
          null,
          2,
          2,
          { threshold: perceptionStatics.diff.yiqThreshold, includeAA: false },
        ],
      ]);
    });
  });

  describe('dimension mismatch', () => {
    it("ERROR: {frames of different sizes} => propagates pixelmatch's own size-mismatch error rather than returning a number", () => {
      pixelmatchCompareAdapterProxy();
      const before = DecodedFrameStub({
        width: 2,
        height: 2,
        pixels: new Uint8Array(16).fill(255),
      });
      const after = DecodedFrameStub({ width: 3, height: 2, pixels: new Uint8Array(24).fill(255) });

      expect(() => pixelmatchCompareAdapter({ before, after })).toThrow(
        /^Image sizes do not match\.$/u,
      );
    });
  });
});
