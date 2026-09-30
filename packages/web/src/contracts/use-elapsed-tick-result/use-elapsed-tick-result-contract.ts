/**
 * PURPOSE: Defines the data `useElapsedTickBinding` returns
 *
 * USAGE:
 * useElapsedTickResultContract.parse(value);
 * // Returns validated UseElapsedTickResult
 */
import { z } from '#gateway/npm/zod';

export const useElapsedTickResultContract = z
  .object({ now: z.string().brand<'UseElapsedTickResultNow'>() })
  .brand<'UseElapsedTickResult'>();

export type UseElapsedTickResult = z.infer<typeof useElapsedTickResultContract>;
