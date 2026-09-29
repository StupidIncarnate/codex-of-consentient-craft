/**
 * PURPOSE: Compares two shot PNGs and answers the raw COUNT of pixels that differ. Reach for this
 * over `shotChangeReadBroker` whenever the question is "did anything change at all": that broker
 * rounds to a whole percent, and a text node changing on a 1280x720 frame moves about 0.1% of its
 * pixels, which rounds to '0%'. Two frames of differing dimensions answer the larger frame's whole
 * pixel count — a resize changes every coordinate, so every pixel counts as changed.
 *
 * USAGE:
 * await shotDiffCountBroker({ previousPath, currentPath });
 * // Returns a branded ReadingCount, e.g. 1036
 */

import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { pixelmatchCompareAdapter } from '../../../adapters/pixelmatch/compare/pixelmatch-compare-adapter';
import { pngjsDecodeAdapter } from '../../../adapters/pngjs/decode/pngjs-decode-adapter';
import { readingCountContract } from '../../../contracts/reading-count/reading-count-contract';
import type { ReadingCount } from '../../../contracts/reading-count/reading-count-contract';

export const shotDiffCountBroker = async ({
  previousPath,
  currentPath,
}: {
  previousPath: AbsoluteFilePath;
  currentPath: AbsoluteFilePath;
}): Promise<ReadingCount> => {
  const [previousBytes, currentBytes] = await Promise.all([
    fsReadFileAdapter({ filePath: previousPath, encoding: 'latin1' }),
    fsReadFileAdapter({ filePath: currentPath, encoding: 'latin1' }),
  ]);

  const previousFrame = pngjsDecodeAdapter({ bytes: previousBytes });
  const currentFrame = pngjsDecodeAdapter({ bytes: currentBytes });

  if (previousFrame.width !== currentFrame.width || previousFrame.height !== currentFrame.height) {
    return readingCountContract.parse(
      Math.max(
        previousFrame.width * previousFrame.height,
        currentFrame.width * currentFrame.height,
      ),
    );
  }

  return pixelmatchCompareAdapter({ before: previousFrame, after: currentFrame });
};
