/**
 * PURPOSE: Defines the filter options for a ward run
 *
 * USAGE:
 * runFiltersContract.parse({committed: true, only: ['lint']});
 * // Returns: RunFilters validated object
 */

import { z } from '#gateway/npm/zod';
import { checkTypeContract } from '../check-type/check-type-contract';

export const runFiltersContract = z.object({
  committed: z.boolean().optional(),
  uncommitted: z.boolean().optional(),
  only: z.array(checkTypeContract).optional(),
  passthrough: z.array(z.string().brand<'RunFiltersPassthrough'>()).optional(),
}).brand<'RunFilters'>();

export type RunFilters = z.infer<typeof runFiltersContract>;
