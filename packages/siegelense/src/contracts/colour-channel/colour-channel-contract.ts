/**
 * PURPOSE: One 8-bit RGB channel value (0-255) sampled from a decoded frame — what
 * `rgbaToHexTransformer` renders as two lowercase hex digits for `BlankReading.colour`. Reach for
 * this over `PixelCount`: `PixelCount` measures an AXIS of a frame's size, while `ColourChannel`
 * measures the intensity of one channel at a single sampled pixel, and the two stay distinct so a
 * caller cannot pass a frame dimension where a colour value belongs.
 *
 * USAGE:
 * colourChannelContract.parse(13);
 * // Returns a branded ColourChannel
 */

import { z } from 'zod';

import { perceptionStatics } from '../../statics/perception/perception-statics';

export const colourChannelContract = z
  .number()
  .int()
  .min(0)
  .max(perceptionStatics.channel.maxValue)
  .brand<'ColourChannel'>();

export type ColourChannel = z.infer<typeof colourChannelContract>;
