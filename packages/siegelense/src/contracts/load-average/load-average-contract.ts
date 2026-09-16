/**
 * PURPOSE: The 1/5/15-minute load average triple `machine`'s reading reports, in that fixed order
 * (spec line 1171: `loadAvg: [7.9, 6.2, 4.1]`). Reach for this over three separate fields when the
 * value is the ordered triple the kernel itself reports — a caller reads `loadAvg[0]` for "right
 * now", never a named key it would have to already know.
 *
 * USAGE:
 * loadAverageContract.parse([7.9, 6.2, 4.1]);
 * // Returns a branded LoadAverage
 */

import { z } from 'zod';

export const loadAverageContract = z
  .tuple([z.number(), z.number(), z.number()])
  .brand<'LoadAverage'>();

export type LoadAverage = z.infer<typeof loadAverageContract>;
