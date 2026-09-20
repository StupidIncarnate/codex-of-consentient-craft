/**
 * PURPOSE: The blank-frame check every capture runs FIRST, before `pixelChange` is interpreted at all
 * (siegelense-tooling.md line 1631: "checked BEFORE `pixelChange` is interpreted" — two consecutive
 * blank frames read as `pixelChange: 0%`, which this design would otherwise mistake for "the control
 * did nothing" rather than "the page is dead"). `colour` is non-null exactly when `blank` is true, so
 * a caller can render line 723's own example — `'BLANK — single colour #0d0907 across the whole
 * frame'` — without a second lookup. Reach for this over reading `blank`/`blankColour` straight off a
 * `StepReading`: this is the shape the perception broker that COMPUTES a blank reading hands back,
 * before those two fields are split apart onto the reading and the shot listing.
 *
 * USAGE:
 * blankReadingContract.parse({ blank: true, colour: '#0d0907' });
 * // Returns a validated BlankReading
 */

import { z } from 'zod';

import { hexColourContract } from '../hex-colour/hex-colour-contract';

export const blankReadingContract = z.object({
  blank: z.boolean(),
  colour: hexColourContract.nullable(),
});

export type BlankReading = z.infer<typeof blankReadingContract>;
