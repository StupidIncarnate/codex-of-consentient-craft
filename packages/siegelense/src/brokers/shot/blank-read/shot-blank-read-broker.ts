/**
 * PURPOSE: Reads a shot PNG and answers the blank-frame verdict every capture carries, checked
 * BEFORE `pixelChange` is interpreted at all (siegelense-tooling.md line 1631). Samples every
 * `perceptionStatics.blank.sampleStride`-th pixel against the first sampled pixel and answers
 * blank only when EVERY sample stays within `channelTolerance` — full-blank only (line 730), so a
 * page showing chrome with one differing region reports `blank: false` rather than a partial
 * match. Reads with `'latin1'` rather than `fsReadFileAdapter`'s `'utf8'` default: a PNG is
 * binary, and `pngjsDecodeAdapter` only round-trips bytes read that way.
 *
 * USAGE:
 * await shotBlankReadBroker({ shotPath: AbsoluteFilePathStub({ value: '/repo/.../step1.png' }) });
 * // Returns { blank: true, colour: '#0d0907' } or { blank: false, colour: null }
 */

import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { pngjsDecodeAdapter } from '../../../adapters/pngjs/decode/pngjs-decode-adapter';
import { blankReadingContract } from '../../../contracts/blank-reading/blank-reading-contract';
import type { BlankReading } from '../../../contracts/blank-reading/blank-reading-contract';
import { colourChannelContract } from '../../../contracts/colour-channel/colour-channel-contract';
import { perceptionStatics } from '../../../statics/perception/perception-statics';
import { rgbaToHexTransformer } from '../../../transformers/rgba-to-hex/rgba-to-hex-transformer';

const RGBA_CHANNEL_COUNT = 4;
const RED_BYTE_OFFSET = 0;
const GREEN_BYTE_OFFSET = 1;
const BLUE_BYTE_OFFSET = 2;

export const shotBlankReadBroker = async ({
  shotPath,
}: {
  shotPath: AbsoluteFilePath;
}): Promise<BlankReading> => {
  const bytes = await fsReadFileAdapter({ filePath: shotPath, encoding: 'latin1' });
  const frame = pngjsDecodeAdapter({ bytes });
  const totalPixels = frame.width * frame.height;

  const referenceRed = frame.pixels[RED_BYTE_OFFSET];
  const referenceGreen = frame.pixels[GREEN_BYTE_OFFSET];
  const referenceBlue = frame.pixels[BLUE_BYTE_OFFSET];
  if (referenceRed === undefined || referenceGreen === undefined || referenceBlue === undefined) {
    throw new Error(`shotBlankReadBroker: decoded frame at ${shotPath} has no pixels to sample`);
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
        `shotBlankReadBroker: decoded frame at ${shotPath} ended before pixel offset ${String(offset)}`,
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
      red: colourChannelContract.parse(referenceRed),
      green: colourChannelContract.parse(referenceGreen),
      blue: colourChannelContract.parse(referenceBlue),
    }),
  });
};
