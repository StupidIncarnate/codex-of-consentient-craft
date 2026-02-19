/**
 * PURPOSE: Defines the filter options for a ward run
 *
 * USAGE:
 * runFiltersContract.parse({changed: true, only: ['lint']});
 * // Returns: RunFilters validated object
 */

import { z } from 'zod';
import { checkTypeContract } from '../check-type/check-type-contract';

export const runFiltersContract = z.object({
  changed: z.boolean().optional(),
  only: z.array(checkTypeContract).optional(),
  passthrough: z.array(z.string().brand<'PassthroughArg'>()).optional(),
});

export type RunFilters = z.infer<typeof runFiltersContract>;
