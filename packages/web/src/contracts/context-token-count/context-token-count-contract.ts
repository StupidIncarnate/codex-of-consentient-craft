/**
 * PURPOSE: Defines a branded number type for total context window token count (input + cache creation + cache read)
 *
 * USAGE:
 * contextTokenCountContract.parse(29448);
 * // Returns: ContextTokenCount branded number
 */

import { z } from 'zod';

export const contextTokenCountContract = z
  .number()
  .int()
  .nonnegative()
  .brand<'ContextTokenCount'>();

export type ContextTokenCount = z.infer<typeof contextTokenCountContract>;
