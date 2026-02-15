/**
 * PURPOSE: Defines a branded number type for animation interval durations in milliseconds
 *
 * USAGE:
 * animationIntervalMsContract.parse(2000);
 * // Returns: AnimationIntervalMs branded number
 */

import { z } from 'zod';

export const animationIntervalMsContract = z
  .number()
  .int()
  .positive()
  .brand<'AnimationIntervalMs'>();

export type AnimationIntervalMs = z.infer<typeof animationIntervalMsContract>;
