/**
 * PURPOSE: Defines the filter options for a ward run
 *
 * USAGE:
 * runFiltersContract.parse({glob: 'packages/ward/**', changed: true, only: ['lint']});
 * // Returns: RunFilters validated object
 */

import { z } from 'zod';
import { checkTypeContract } from '../check-type/check-type-contract';

export const runFiltersContract = z.object({
  glob: z.string().brand<'GlobPattern'>().optional(),
  changed: z.boolean().optional(),
  only: z.array(checkTypeContract).optional(),
});

export type RunFilters = z.infer<typeof runFiltersContract>;
