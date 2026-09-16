/**
 * PURPOSE: Renders three sampled 0-255 channels as the lower-case six-digit `#rrggbb` string
 * `BlankReading.colour` carries (siegelense-tooling.md line 719: "the COLOUR is part of the
 * answer, not decoration"). Zero-pads each channel so a low byte like 7 renders as `07`, never
 * `7` — the hex-colour contract's own regex demands exactly six digits, and the `#0d0907`
 * app-background case (line 723) is what proves the padding.
 *
 * USAGE:
 * rgbaToHexTransformer({
 *   red: ColourChannelStub({ value: 13 }),
 *   green: ColourChannelStub({ value: 9 }),
 *   blue: ColourChannelStub({ value: 7 }),
 * });
 * // Returns '#0d0907' as branded HexColour
 */

import { hexColourContract } from '../../contracts/hex-colour/hex-colour-contract';
import type { HexColour } from '../../contracts/hex-colour/hex-colour-contract';
import type { ColourChannel } from '../../contracts/colour-channel/colour-channel-contract';

const HEX_RADIX = 16;
const HEX_DIGITS_PER_CHANNEL = 2;

export const rgbaToHexTransformer = ({
  red,
  green,
  blue,
}: {
  red: ColourChannel;
  green: ColourChannel;
  blue: ColourChannel;
}): HexColour => {
  const hexValue = `#${red.toString(HEX_RADIX).padStart(HEX_DIGITS_PER_CHANNEL, '0')}${green.toString(HEX_RADIX).padStart(HEX_DIGITS_PER_CHANNEL, '0')}${blue.toString(HEX_RADIX).padStart(HEX_DIGITS_PER_CHANNEL, '0')}`;

  return hexColourContract.parse(hexValue);
};
