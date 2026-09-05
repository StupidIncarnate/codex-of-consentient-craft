/**
 * PURPOSE: Defines the configuration options for a ward run
 *
 * USAGE:
 * wardConfigContract.parse({only: ['lint'], committed: true});
 * // Returns: WardConfig validated object
 *
 * `committed` and `uncommitted` are the two GIT SCOPE flags, and they are complementary rather than
 * rival: `committed` covers what this branch's commits added on top of origin's default branch, and
 * `uncommitted` covers what the working tree holds that HEAD does not. Neither includes the other's
 * files, so both may be set at once and the resolved file list is their union.
 */

import { z } from 'zod';
import { checkTypeContract } from '../check-type/check-type-contract';

export const wardConfigContract = z.object({
  only: z.array(checkTypeContract).optional(),
  onlyTests: z.string().brand<'TestNamePattern'>().optional(),
  committed: z.boolean().optional(),
  uncommitted: z.boolean().optional(),
  passthrough: z.array(z.string().brand<'PassthroughArg'>()).optional(),
});

export type WardConfig = z.infer<typeof wardConfigContract>;
