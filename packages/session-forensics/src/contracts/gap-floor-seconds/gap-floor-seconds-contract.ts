/**
 * PURPOSE: Validates the `--floor-seconds` CLI flag on the `gaps` command — a raw argv string,
 * never trusted until parsed here. `z.coerce.number()` turns the string into a number before
 * `.int()` and `.positive()` reject anything that is not a whole number of seconds above zero, so a
 * typo like `--floor-seconds abc` or `--floor-seconds -30` fails at the boundary instead of
 * silently falling through to `recordsToGapsTransformer`'s own default.
 *
 * USAGE:
 * gapFloorSecondsContract.parse('30');
 * // Returns: 30 as GapFloorSeconds
 */
import { z } from 'zod';

export const gapFloorSecondsContract = z.coerce
  .number()
  .int()
  .positive()
  .brand<'GapFloorSeconds'>();

export type GapFloorSeconds = z.infer<typeof gapFloorSecondsContract>;
