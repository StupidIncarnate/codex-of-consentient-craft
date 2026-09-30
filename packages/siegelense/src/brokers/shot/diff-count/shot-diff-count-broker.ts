/**
 * PURPOSE: Compares two shot PNGs and answers the raw COUNT of pixels that differ. Reach for this
 * over `shotChangeReadBroker` whenever the question is "did anything change at all": that broker
 * rounds to a whole percent, and a text node changing on a 1280x720 frame moves about 0.1% of its
 * pixels, which rounds to '0%'. Two frames of differing dimensions answer the larger frame's whole
 * pixel count — a resize changes every coordinate, so every pixel counts as changed.
 *
 * USAGE:
 * await shotDiffCountBroker({ previousPath, currentPath });
 * // Returns the differing-pixel count, e.g. 1036
 */

import { readFileBytes } from '#gateway/node/fs__promises';
import { Buffer } from '#gateway/node/buffer';
import pixelmatch from '#gateway/npm/pixelmatch';
import { decodePng } from '#gateway/npm/pngjs';

import { perceptionStatics } from '../../../statics/perception/perception-statics';

export const shotDiffCountBroker = async ({
  previousPath,
  currentPath,
}: {
  previousPath: string;
  currentPath: string;
}): Promise<number> => {
  const [previousBytes, currentBytes] = await Promise.all([
    readFileBytes(previousPath),
    readFileBytes(currentPath),
  ]);

  const previousFrame = decodePng({ bytes: Buffer.from(previousBytes) });
  const currentFrame = decodePng({ bytes: Buffer.from(currentBytes) });

  if (previousFrame.width !== currentFrame.width || previousFrame.height !== currentFrame.height) {
    return Math.max(
      previousFrame.width * previousFrame.height,
      currentFrame.width * currentFrame.height,
    );
  }

  return pixelmatch(
    previousFrame.pixels,
    currentFrame.pixels,
    null,
    previousFrame.width,
    previousFrame.height,
    {
      threshold: perceptionStatics.diff.yiqThreshold,
      includeAA: false,
    },
  );
};
