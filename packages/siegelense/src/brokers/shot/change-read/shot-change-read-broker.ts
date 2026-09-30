/**
 * PURPOSE: Compares two shot PNGs and answers `pixelChange` — the changed-pixel count beside its
 * two-decimal share, `0 px` for identical frames — per INSTANCE rather than per run
 * (siegelense-tooling.md line 691: "wherever that was taken"). `previousPath` arrives already
 * resolved by the caller (the instance's own `driverSessionState.lastShotPath()`, `null` before
 * the instance's first capture), and this broker answers `null` right back rather than
 * manufacturing a no-change finding (line 708). The count comes from `shotDiffCountBroker`, so
 * `hold` and every acting step count the same way; two frames of differing dimensions count the
 * larger frame's whole area, which reads as 100% (a `resize` changes every coordinate).
 *
 * USAGE:
 * await shotChangeReadBroker({ previousPath: null, currentPath });
 * // Returns null — no predecessor to compare against
 *
 * await shotChangeReadBroker({ previousPath, currentPath });
 * // Returns '0.11% (1036 px)' — a branded PixelChange
 */

import { readFileBytes } from '#gateway/node/fs__promises';
import { Buffer } from '#gateway/node/buffer';
import { decodePng } from '#gateway/npm/pngjs';

import { pixelChangeFormatTransformer } from '../../../transformers/pixel-change-format/pixel-change-format-transformer';
import { shotDiffCountBroker } from '../diff-count/shot-diff-count-broker';

export const shotChangeReadBroker = async ({
  previousPath,
  currentPath,
}: {
  previousPath: string | null;
  currentPath: string;
}): Promise<string | null> => {
  if (previousPath === null) {
    return null;
  }

  const [diffCount, previousBytes, currentBytes] = await Promise.all([
    shotDiffCountBroker({ previousPath, currentPath }),
    readFileBytes(previousPath),
    readFileBytes(currentPath),
  ]);

  const previousFrame = decodePng({ bytes: Buffer.from(previousBytes) });
  const currentFrame = decodePng({ bytes: Buffer.from(currentBytes) });
  const totalPixels = Math.max(
    previousFrame.width * previousFrame.height,
    currentFrame.width * currentFrame.height,
  );

  return pixelChangeFormatTransformer({ diffCount, totalPixels });
};
