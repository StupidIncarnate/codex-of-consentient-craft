/**
 * PURPOSE: Defines the SetResult shape that content-item-agent-id-set-at-index-transformer builds
 *
 * USAGE:
 * setResultContract.parse(value);
 * // Returns validated SetResult
 */
import { z } from '#gateway/npm/zod';

export const setResultContract = z.discriminatedUnion('success', [
  z.object({ success: z.literal(true) }).brand<'SetResult'>(),
  z.object({ success: z.literal(false) }).brand<'SetResult'>(),
]);

export type SetResult = z.infer<typeof setResultContract>;
