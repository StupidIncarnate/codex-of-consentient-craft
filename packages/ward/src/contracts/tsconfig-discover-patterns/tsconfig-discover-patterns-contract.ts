/**
 * PURPOSE: Defines the data `tsconfigDiscoverPatternsTransformer` returns
 *
 * USAGE:
 * tsconfigDiscoverPatternsContract.parse(value);
 * // Returns validated TsconfigDiscoverPatterns
 */
import { z } from '#gateway/npm/zod';

export const tsconfigDiscoverPatternsContract = z
  .object({
    patterns: z.array(z.string().brand<'TsconfigDiscoverPatternsPatterns'>()),
    exclude: z.array(z.string().brand<'TsconfigDiscoverPatternsExclude'>()),
  })
  .brand<'TsconfigDiscoverPatterns'>();

export type TsconfigDiscoverPatterns = z.infer<typeof tsconfigDiscoverPatternsContract>;
