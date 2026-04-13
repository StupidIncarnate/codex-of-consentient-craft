/**
 * PURPOSE: Defines the standard return type for side-effect adapters that have no natural return value
 *
 * USAGE:
 * const result = adapterResultContract.parse({ success: true });
 * // Returns validated AdapterResult
 *
 * WHEN-TO-USE: When an adapter performs a side effect (file write, mkdir, delete) and needs a non-void return type
 * WHEN-NOT-TO-USE: When the adapter has a natural return value (file contents, UUID, port number)
 */
import { z } from 'zod';

export const adapterResultContract = z.object({
  success: z.literal(true),
});

export type AdapterResult = z.infer<typeof adapterResultContract>;
