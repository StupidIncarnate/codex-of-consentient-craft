/**
 * PURPOSE: Validates the subset of tsconfig.json used by ward (include/exclude string arrays)
 *
 * USAGE:
 * tsconfigJsonContract.parse(rawTsconfigData);
 * // Returns: TsconfigJson with optional include/exclude string arrays
 */

import { z } from 'zod';

export const tsconfigJsonContract = z
  .object({
    include: z.array(z.string().brand<'TsconfigInclude'>()).optional(),
    exclude: z.array(z.string().brand<'TsconfigExclude'>()).optional(),
  })
  .passthrough();

export type TsconfigJson = z.infer<typeof tsconfigJsonContract>;
