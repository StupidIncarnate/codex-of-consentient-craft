/**
 * PURPOSE: Defines one entry in `flow.offMapSignoffs` — an off-map probe family
 *
 * USAGE:
 * flowOffMapSignoffContract.parse({
 *   id: 'concurrency',
 * });
 * // Returns: FlowOffMapSignoff — one element of flow.offMapSignoffs[]
 *
 * This is an ID-BEARING ARRAY, not a `Record` keyed by family, and that is load-bearing. The quest
 * deep-merge (`questItemDeepMergeTransformer`) recurses only into arrays of id-bearing objects and
 * replaces every other object value WHOLESALE. A `Record<QaOffMapFamily, ...>` would therefore be
 * overwritten in full on every write, so a walk signing off `concurrency` alone would erase the
 * `re-entry`, `staleness`, `interruption`, `configuration` and `hostile-input` sign-offs recorded
 * before it. Reusing the family as the array element's `id` keeps the merge an upsert.
 */

import { z } from 'zod';

import { qaOffMapFamilyContract } from '../qa-off-map-family/qa-off-map-family-contract';

export const flowOffMapSignoffContract = z.object({
  id: qaOffMapFamilyContract,
});

export type FlowOffMapSignoff = z.infer<typeof flowOffMapSignoffContract>;
