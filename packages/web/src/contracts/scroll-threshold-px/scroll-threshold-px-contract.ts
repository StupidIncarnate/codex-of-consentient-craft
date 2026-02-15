/**
 * PURPOSE: Defines a branded number type for scroll threshold pixel values used in scroll anchoring
 *
 * USAGE:
 * scrollThresholdPxContract.parse(10);
 * // Returns: ScrollThresholdPx branded number
 */

import { z } from 'zod';

export const scrollThresholdPxContract = z
  .number()
  .int()
  .nonnegative()
  .brand<'ScrollThresholdPx'>();

export type ScrollThresholdPx = z.infer<typeof scrollThresholdPxContract>;
