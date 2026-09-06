import { pastedImageStatics } from '@dungeonmaster/shared/statics';

import { ImageSizeStub } from '../../contracts/image-size/image-size.stub';
import { downscaleTargetTransformer } from './downscale-target-transformer';

describe('downscaleTargetTransformer', () => {
  describe('over the cap', () => {
    // The arithmetic half of quest observable #check-downscale-caps-longest-edge: pasting a
    // 6000x4000 PNG must yield an attachment whose longest edge is exactly the cap.
    it('VALID: {widthPx: 6000, heightPx: 4000, longestEdgePx: maxLongestEdgePx} => the wide edge lands exactly on the cap (#check-downscale-caps-longest-edge)', () => {
      const result = downscaleTargetTransformer({
        size: ImageSizeStub({ widthPx: 6000, heightPx: 4000 }),
        longestEdgePx: pastedImageStatics.maxLongestEdgePx,
      });

      expect(result).toStrictEqual({
        widthPx: pastedImageStatics.maxLongestEdgePx,
        heightPx: 1333,
      });
    });

    it('VALID: {widthPx: 4000, heightPx: 6000, longestEdgePx: maxLongestEdgePx} => the tall edge lands exactly on the cap', () => {
      const result = downscaleTargetTransformer({
        size: ImageSizeStub({ widthPx: 4000, heightPx: 6000 }),
        longestEdgePx: pastedImageStatics.maxLongestEdgePx,
      });

      expect(result).toStrictEqual({
        widthPx: 1333,
        heightPx: pastedImageStatics.maxLongestEdgePx,
      });
    });

    it('VALID: {widthPx: 3000, heightPx: 3000, longestEdgePx: maxLongestEdgePx} => a square shrinks on both edges', () => {
      const result = downscaleTargetTransformer({
        size: ImageSizeStub({ widthPx: 3000, heightPx: 3000 }),
        longestEdgePx: pastedImageStatics.maxLongestEdgePx,
      });

      expect(result).toStrictEqual({
        widthPx: pastedImageStatics.maxLongestEdgePx,
        heightPx: pastedImageStatics.maxLongestEdgePx,
      });
    });

    // An unfloored scale factor rounds a very thin edge down to 0, which pixelLengthContract
    // rejects outright — the floor at MIN_EDGE_PX is what keeps a panorama from throwing here.
    it('EDGE: {widthPx: 20000, heightPx: 3, longestEdgePx: maxLongestEdgePx} => the thin edge floors at 1px rather than rounding to 0', () => {
      const result = downscaleTargetTransformer({
        size: ImageSizeStub({ widthPx: 20000, heightPx: 3 }),
        longestEdgePx: pastedImageStatics.maxLongestEdgePx,
      });

      expect(result).toStrictEqual({ widthPx: pastedImageStatics.maxLongestEdgePx, heightPx: 1 });
    });
  });

  describe('not over the cap', () => {
    it('EDGE: {widthPx: maxLongestEdgePx, heightPx: 1500, longestEdgePx: maxLongestEdgePx} => a size already at the cap comes back unchanged', () => {
      const result = downscaleTargetTransformer({
        size: ImageSizeStub({ widthPx: pastedImageStatics.maxLongestEdgePx, heightPx: 1500 }),
        longestEdgePx: pastedImageStatics.maxLongestEdgePx,
      });

      expect(result).toStrictEqual({
        widthPx: pastedImageStatics.maxLongestEdgePx,
        heightPx: 1500,
      });
    });

    it('EDGE: {widthPx: 800, heightPx: 600, longestEdgePx: maxLongestEdgePx} => a size under the cap comes back unchanged, not scaled up', () => {
      const result = downscaleTargetTransformer({
        size: ImageSizeStub({ widthPx: 800, heightPx: 600 }),
        longestEdgePx: pastedImageStatics.maxLongestEdgePx,
      });

      expect(result).toStrictEqual({ widthPx: 800, heightPx: 600 });
    });
  });
});
