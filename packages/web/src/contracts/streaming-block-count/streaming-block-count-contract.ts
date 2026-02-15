/**
 * PURPOSE: Defines a branded non-negative integer type for tracking how many content blocks have been streamed in the current assistant turn
 *
 * USAGE:
 * streamingBlockCountContract.parse(3);
 * // Returns: StreamingBlockCount branded number
 */

import { z } from 'zod';

export const streamingBlockCountContract = z
  .number()
  .int()
  .nonnegative()
  .brand<'StreamingBlockCount'>();

export type StreamingBlockCount = z.infer<typeof streamingBlockCountContract>;
