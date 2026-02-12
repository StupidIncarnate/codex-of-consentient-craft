/**
 * PURPOSE: Defines a branded non-negative integer type for tracking buffer read position
 *
 * USAGE:
 * bufferCursorIndexContract.parse(0);
 * // Returns: BufferCursorIndex branded number
 */

import { z } from 'zod';

export const bufferCursorIndexContract = z
  .number()
  .int()
  .nonnegative()
  .brand<'BufferCursorIndex'>();

export type BufferCursorIndex = z.infer<typeof bufferCursorIndexContract>;
