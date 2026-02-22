/**
 * PURPOSE: Defines a mutable buffer state for accumulating string data
 *
 * USAGE:
 * const buffer: BufferState = bufferStateContract.parse({ value: '' });
 * buffer.value += chunk.toString();
 */
import { z } from 'zod';

export const bufferStateContract = z.object({
  value: z.string().brand<'BufferValue'>(),
});

export type BufferState = z.infer<typeof bufferStateContract>;
