/**
 * PURPOSE: Reads a shot PNG and answers the blank-frame verdict every capture carries, checked
 * BEFORE `pixelChange` is interpreted at all (siegelense-tooling.md line 1631). Samples every
 * `perceptionStatics.blank.sampleStride`-th pixel against the first sampled pixel and answers
 * blank only when EVERY sample stays within `channelTolerance` — full-blank only (line 730), so a
 * page showing chrome with one differing region reports `blank: false` rather than a partial
 * match. Reads raw bytes with `readFileBytes`: a PNG is binary, and a text read corrupts it.
 *
 * USAGE:
 * await shotBlankReadBroker({ shotPath: '/repo/.../step1.png' });
 * // Returns { blank: true, colour: '#0d0907' } or { blank: false, colour: null }
 */

import { readFileBytes } from '#gateway/node/fs__promises';
import { decodePng } from '#gateway/npm/pngjs';

import { blankReadingContract } from '../../../contracts/blank-reading/blank-reading-contract';
import type { BlankReading } from '../../../contracts/blank-reading/blank-reading-contract';
import { perceptionStatics } from '../../../statics/perception/perception-statics';
import { rgbaToHexTransformer } from '../../../transformers/rgba-to-hex/rgba-to-hex-transformer';
import { Buffer } from '#gateway/node/buffer';

const RGBA_CHANNEL_COUNT = 4;
const RED_BYTE_OFFSET = 0;
const GREEN_BYTE_OFFSET = 1;
const BLUE_BYTE_OFFSET = 2;

export const shotBlankReadBroker = async ({
  shotPath,
}: {
  shotPath: string;
}): Promise<BlankReading> => {
  const bytes = await readFileBytes(shotPath);
  const frame = decodePng({ bytes: Buffer.from(bytes) });
  const totalPixels = frame.width * frame.height;

  const referenceRed = frame.pixels[RED_BYTE_OFFSET];
  const referenceGreen = frame.pixels[GREEN_BYTE_OFFSET];
  const referenceBlue = frame.pixels[BLUE_BYTE_OFFSET];
  if (referenceRed === undefined || referenceGreen === undefined || referenceBlue === undefined) {
    throw new Error(
      `The screenshot at ${shotPath} decoded with no pixels to sample — the capture is likely ` +
        `corrupt; retake it.`,
    );
  }

  for (
    let pixelIndex = 0;
    pixelIndex < totalPixels;
    pixelIndex += perceptionStatics.blank.sampleStride
  ) {
    const offset = pixelIndex * RGBA_CHANNEL_COUNT;
    const sampleRed = frame.pixels[offset + RED_BYTE_OFFSET];
    const sampleGreen = frame.pixels[offset + GREEN_BYTE_OFFSET];
    const sampleBlue = frame.pixels[offset + BLUE_BYTE_OFFSET];
    if (sampleRed === undefined || sampleGreen === undefined || sampleBlue === undefined) {
      throw new Error(
        `The screenshot at ${shotPath} decoded short of pixel offset ${String(offset)} — the ` +
          `capture is likely corrupt; retake it.`,
      );
    }

    const isWithinTolerance =
      Math.abs(sampleRed - referenceRed) <= perceptionStatics.blank.channelTolerance &&
      Math.abs(sampleGreen - referenceGreen) <= perceptionStatics.blank.channelTolerance &&
      Math.abs(sampleBlue - referenceBlue) <= perceptionStatics.blank.channelTolerance;

    if (!isWithinTolerance) {
      return blankReadingContract.parse({ blank: false, colour: null });
    }
  }

  return blankReadingContract.parse({
    blank: true,
    colour: rgbaToHexTransformer({
      red: referenceRed,
      green: referenceGreen,
      blue: referenceBlue,
    }),
  });
};
