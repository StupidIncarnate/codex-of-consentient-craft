/**
 * PURPOSE: Defines delay duration in milliseconds for process simulation
 *
 * USAGE:
 * const delay = delayMillisecondsContract.parse(1000);
 * // Returns validated DelayMilliseconds branded type
 */

import { z } from 'zod';

export const delayMillisecondsContract = z
  .number()
  .int()
  .nonnegative()
  .brand<'DelayMilliseconds'>();

export type DelayMilliseconds = z.infer<typeof delayMillisecondsContract>;
