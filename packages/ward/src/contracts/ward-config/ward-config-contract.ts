/**
 * PURPOSE: Defines the configuration options for a ward run
 *
 * USAGE:
 * wardConfigContract.parse({only: ['lint'], verbose: true});
 * // Returns: WardConfig validated object
 */

import { z } from 'zod';
import { checkTypeContract } from '../check-type/check-type-contract';

export const wardConfigContract = z.object({
  only: z.array(checkTypeContract).optional(),
  glob: z.string().brand<'ConfigGlob'>().optional(),
  changed: z.boolean().optional(),
  verbose: z.boolean().optional(),
});

export type WardConfig = z.infer<typeof wardConfigContract>;
