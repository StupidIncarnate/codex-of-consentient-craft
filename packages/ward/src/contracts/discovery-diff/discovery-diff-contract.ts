/**
 * PURPOSE: Defines the data `discoveryDiffTransformer` returns
 *
 * USAGE:
 * discoveryDiffContract.parse(value);
 * // Returns validated DiscoveryDiff
 */
import { z } from '#gateway/npm/zod';

export const discoveryDiffContract = z
  .object({
    onlyDiscovered: z.array(z.string().brand<'DiscoveryDiffOnlyDiscovered'>()),
    onlyProcessed: z.array(z.string().brand<'DiscoveryDiffOnlyProcessed'>()),
  })
  .brand<'DiscoveryDiff'>();

export type DiscoveryDiff = z.infer<typeof discoveryDiffContract>;
