/**
 * PURPOSE: Compares two shot PNGs and answers the whole-number percent of pixels that differ —
 * `pixelChange`, per INSTANCE rather than per run (siegelense-tooling.md line 691: "wherever that
 * was taken"). `previousPath` arrives already resolved by the caller (the instance's own
 * `driverSessionState.lastShotPath()`, `null` before the instance's first capture), and this
 * broker answers `null` right back rather than manufacturing a `0%` no-change finding (line 708).
 * Two frames of differing dimensions answer '100%' — changing viewport dimensions via `resize`
 * changes every coordinate on the canvas, so 100% of pixels differ (chunk-03-read-path-and-perception.md
 * line 310: "When resize lands... it gets the answer it needs").
 *
 * USAGE:
 * await shotChangeReadBroker({ previousPath: null, currentPath });
 * // Returns null — no predecessor to compare against
 *
 * await shotChangeReadBroker({ previousPath, currentPath });
 * // Returns '2%' — a branded PixelChange
 */

import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { pixelmatchCompareAdapter } from '../../../adapters/pixelmatch/compare/pixelmatch-compare-adapter';
import { pngjsDecodeAdapter } from '../../../adapters/pngjs/decode/pngjs-decode-adapter';
import { pixelChangeContract } from '../../../contracts/pixel-change/pixel-change-contract';
import type { PixelChange } from '../../../contracts/pixel-change/pixel-change-contract';

const PERCENT_MULTIPLIER = 100;

export const shotChangeReadBroker = async ({
  previousPath,
  currentPath,
}: {
  previousPath: AbsoluteFilePath | null;
  currentPath: AbsoluteFilePath;
}): Promise<PixelChange | null> => {
  if (previousPath === null) {
    return null;
  }

  const [previousBytes, currentBytes] = await Promise.all([
    fsReadFileAdapter({ filePath: previousPath, encoding: 'latin1' }),
    fsReadFileAdapter({ filePath: currentPath, encoding: 'latin1' }),
  ]);

  const previousFrame = pngjsDecodeAdapter({ bytes: previousBytes });
  const currentFrame = pngjsDecodeAdapter({ bytes: currentBytes });

  if (previousFrame.width !== currentFrame.width || previousFrame.height !== currentFrame.height) {
    return pixelChangeContract.parse('100%');
  }

  const totalPixels = previousFrame.width * previousFrame.height;
  const diffCount = pixelmatchCompareAdapter({ before: previousFrame, after: currentFrame });
  const percent = Math.round((diffCount / totalPixels) * PERCENT_MULTIPLIER);

  return pixelChangeContract.parse(`${String(percent)}%`);
};
