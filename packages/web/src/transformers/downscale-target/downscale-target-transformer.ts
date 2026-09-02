/**
 * PURPOSE: This arithmetic lives outside the canvas adapter so it can be proven against real
 * numbers — jsdom has no canvas, so anything inside that adapter is only ever seen through a mock.
 * The downscale ladder decides WHICH cap to try, halving it on each retry; this decides the
 * resulting pair for whichever cap it is handed.
 *
 * USAGE:
 * downscaleTargetTransformer({ size: { widthPx: 6000, heightPx: 4000 }, longestEdgePx: 2000 });
 * // Returns: { widthPx: 2000, heightPx: 1333 }
 */

import { imageSizeContract } from '../../contracts/image-size/image-size-contract';
import type { ImageSize } from '../../contracts/image-size/image-size-contract';

// A floor for the shrunk edge: an unfloored value can round to 0 for an extreme aspect ratio, and
// pixelLengthContract rejects 0.
const MIN_EDGE_PX = 1;

export const downscaleTargetTransformer = ({
  size,
  longestEdgePx,
}: {
  size: ImageSize;
  longestEdgePx: number;
}): ImageSize => {
  const longestEdge = Math.max(size.widthPx, size.heightPx);

  if (longestEdge <= longestEdgePx) {
    return imageSizeContract.parse({ widthPx: size.widthPx, heightPx: size.heightPx });
  }

  const scaledWidth =
    size.widthPx === longestEdge
      ? longestEdgePx
      : Math.max(MIN_EDGE_PX, Math.round((size.widthPx * longestEdgePx) / longestEdge));
  const scaledHeight =
    size.heightPx === longestEdge
      ? longestEdgePx
      : Math.max(MIN_EDGE_PX, Math.round((size.heightPx * longestEdgePx) / longestEdge));

  return imageSizeContract.parse({ widthPx: scaledWidth, heightPx: scaledHeight });
};
