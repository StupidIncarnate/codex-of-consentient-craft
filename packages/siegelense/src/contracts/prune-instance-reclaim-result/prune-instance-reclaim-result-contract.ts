/**
 * PURPOSE: Defines the data `pruneInstanceReclaimBroker` returns
 *
 * USAGE:
 * pruneInstanceReclaimResultContract.parse(value);
 * // Returns validated PruneInstanceReclaimResult
 */
import { z } from '#gateway/npm/zod';
import { pruneRemovalContract } from '../prune-removal/prune-removal-contract';
import { pruneRefusalContract } from '../prune-refusal/prune-refusal-contract';
import { citationGapContract } from '../citation-gap/citation-gap-contract';

export const pruneInstanceReclaimResultContract = z
  .object({
    removal: pruneRemovalContract.nullable(),
    refusal: pruneRefusalContract.nullable(),
    gaps: z.array(citationGapContract).readonly(),
  })
  .brand<'PruneInstanceReclaimResult'>();

export type PruneInstanceReclaimResult = z.infer<typeof pruneInstanceReclaimResultContract>;
