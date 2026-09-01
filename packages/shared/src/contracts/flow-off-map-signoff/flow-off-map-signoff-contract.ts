/**
 * PURPOSE: Defines one entry in `flow.offMapSignoffs` — an off-map probe family paired with the one
 * sign-off that closes it for this flow
 *
 * USAGE:
 * flowOffMapSignoffContract.parse({
 *   id: 'concurrency',
 *   siegemasterSignoff: {verdict: 'confirmed', evidence: '...', workItemId: '...', at: '...'},
 * });
 * // Returns: FlowOffMapSignoff — one element of flow.offMapSignoffs[]
 *
 * SIEGEMASTER IS THE ONLY TRACK WITH A COLUMN HERE, and the other two are absent for the same
 * reason: a probe family is a breakage class a flow graph structurally cannot draw — a double
 * submit, a killed process, a stale token — so it is measured by hand against a running system and
 * by nothing else. `off-map` appears in `signoffTrackEligibilityStatics.byTrack.siegemaster.unitKinds`
 * alone, and a checklist omits every kind its own track never signs, so no family reaches codeweaver
 * or flowrider at all. A column for either would be a field nothing could ever fill.
 *
 * This is an ID-BEARING ARRAY, not a `Record` keyed by family, and that is load-bearing. The quest
 * deep-merge (`questItemDeepMergeTransformer`) recurses only into arrays of id-bearing objects and
 * replaces every other object value WHOLESALE. A `Record<QaOffMapFamily, ...>` would therefore be
 * overwritten in full on every write, so a walk signing off `concurrency` alone would erase the
 * `re-entry`, `staleness`, `interruption`, `configuration` and `hostile-input` sign-offs recorded
 * before it. Reusing the family as the array element's `id` keeps the merge an upsert.
 *
 * The sign-off is a top-level field rather than a nested `signoffs` block for that same merge rule:
 * a nested object would be replaced wholesale on every write.
 */

import { z } from 'zod';

import { qaOffMapFamilyContract } from '../qa-off-map-family/qa-off-map-family-contract';
import { signoffContract } from '../signoff/signoff-contract';

export const flowOffMapSignoffContract = z.object({
  id: qaOffMapFamilyContract,
  siegemasterSignoff: signoffContract.optional(),
});

export type FlowOffMapSignoff = z.infer<typeof flowOffMapSignoffContract>;
