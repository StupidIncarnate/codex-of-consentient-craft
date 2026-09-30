/**
 * PURPOSE: Renders a measured changed-pixel count over a frame's pixel total as a `PixelChange`
 * reading. Reach for this over rounding to a whole percent: the count rides beside the share, and
 * `0 px` is answered only when the count is zero.
 *
 * USAGE:
 * pixelChangeFormatTransformer({ diffCount, totalPixels });
 * // Returns '0.11% (1036 px)' for 1036 of 921600; '0 px' for 0
 */

import { perceptionStatics } from '../../statics/perception/perception-statics';

export const pixelChangeFormatTransformer = ({
  diffCount,
  totalPixels,
}: {
  diffCount: number;
  totalPixels: number;
}): string => {
  if (diffCount === 0) {
    return '0 px';
  }

  const share = (diffCount / totalPixels) * perceptionStatics.pixelChange.percentMultiplier;
  const shown =
    share < perceptionStatics.pixelChange.shareFloor
      ? `<${String(perceptionStatics.pixelChange.shareFloor)}`
      : share.toFixed(perceptionStatics.pixelChange.shareDecimals);

  return `${shown}% (${String(diffCount)} px)`;
};
