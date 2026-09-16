/**
 * PURPOSE: The lower-case `#rrggbb` reading a blank-frame check names when it fires
 * (siegelense-tooling.md line 719: "the COLOUR is part of the answer, not decoration" — blank in the
 * app's own background means the shell rendered and the content did not, while blank white means the
 * document never styled at all, and those are different bugs). Reach for this over folding the colour
 * into `why`'s own enum: the founding rule in `packages/siegelense/CLAUDE.md` is that a command
 * returns a READING, never a rendered sentence, so the colour stays its own addressable field and a
 * caller builds the English line from `why` plus this value.
 *
 * USAGE:
 * hexColourContract.parse('#0d0907');
 * // Returns a branded HexColour
 */

import { z } from 'zod';

export const hexColourContract = z
  .string()
  .regex(/^#[0-9a-f]{6}$/u)
  .brand<'HexColour'>();

export type HexColour = z.infer<typeof hexColourContract>;
