/**
 * PURPOSE: Defines the data `jestDiscoverPatternsTransformer` returns
 *
 * USAGE:
 * jestDiscoverPatternsContract.parse(value);
 * // Returns validated JestDiscoverPatterns
 */
import { z } from '#gateway/npm/zod';

export const jestDiscoverPatternsContract = z
  .object({
    patterns: z.array(z.string().brand<'JestDiscoverPatternsPatterns'>()),
    excludePatterns: z.array(z.string().brand<'JestDiscoverPatternsExcludePatterns'>()),
  })
  .brand<'JestDiscoverPatterns'>();

export type JestDiscoverPatterns = z.infer<typeof jestDiscoverPatternsContract>;
