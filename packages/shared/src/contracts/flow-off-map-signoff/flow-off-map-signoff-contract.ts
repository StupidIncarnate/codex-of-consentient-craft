/**
 * PURPOSE: Defines one entry in `flow.offMapSignoffs` — an off-map probe family paired with the two
 * independent sign-offs that close it for this flow
 *
 * USAGE:
 * flowOffMapSignoffContract.parse({
 *   id: 'concurrency',
 *   flowriderSignoff: {verdict: 'confirmed', evidence: '...', workItemId: '...', at: '...'},
 * });
 * // Returns: FlowOffMapSignoff — one element of flow.offMapSignoffs[]
 *
 * This is an ID-BEARING ARRAY, not a `Record` keyed by family, and that is load-bearing. The quest
 * deep-merge (`questItemDeepMergeTransformer`) recurses only into arrays of id-bearing objects and
 * replaces every other object value WHOLESALE. A `Record<QaOffMapFamily, ...>` would therefore be
 * overwritten in full on every write, so a role signing off `concurrency` alone would erase the
 * `re-entry`, `staleness`, `interruption`, `configuration` and `hostile-input` sign-offs recorded
 * before it. Reusing the family as the array element's `id` keeps the merge an upsert.
 *
 * Both sign-offs are optional and SEPARATE top-level fields: a family is closed only when both are
 * present, and a nested `signoffs` block would be replaced wholesale by the same merge rule,
 * silently deleting whichever track wrote first.
 */

import { z } from 'zod';

import { qaOffMapFamilyContract } from '../qa-off-map-family/qa-off-map-family-contract';
import { signoffContract } from '../signoff/signoff-contract';

export const flowOffMapSignoffContract = z.object({
  id: qaOffMapFamilyContract,
  flowriderSignoff: signoffContract.optional(),
  siegemasterSignoff: signoffContract.optional(),
});

export type FlowOffMapSignoff = z.infer<typeof flowOffMapSignoffContract>;
