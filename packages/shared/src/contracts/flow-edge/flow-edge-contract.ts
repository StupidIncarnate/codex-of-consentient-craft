/**
 * PURPOSE: Defines the FlowEdge structure for edges connecting flow nodes
 *
 * USAGE:
 * flowEdgeContract.parse({id: 'login-to-dashboard', from: 'login-page', to: 'dashboard', label: 'success'});
 * // Returns: FlowEdge object
 *
 * The sign-offs are TOP-LEVEL SIBLING fields rather than a nested `signoffs` block, because
 * `questItemDeepMergeTransformer` replaces any non-id-bearing object value WHOLESALE — a nested
 * block would let a Siegemaster write delete Flowrider's sign-off while reporting success, whereas
 * sibling keys merge per-key. They are `.optional()` and not `.default()` because `questModifyBroker`
 * re-parses the whole quest on every write, so defaults would materialise into the persisted JSON of
 * every edge that never received a sign-off.
 */

import { z } from 'zod';

import { flowEdgeIdContract } from '../flow-edge-id/flow-edge-id-contract';
import { flowEdgeRefContract } from '../flow-edge-ref/flow-edge-ref-contract';
import { signoffContract } from '../signoff/signoff-contract';

export const flowEdgeContract = z.object({
  id: flowEdgeIdContract,
  from: flowEdgeRefContract,
  to: flowEdgeRefContract,
  label: z.string().brand<'FlowEdgeLabel'>().optional(),
  codeweaverSignoff: signoffContract.optional(),
  flowriderSignoff: signoffContract.optional(),
  siegemasterSignoff: signoffContract.optional(),
});

export type FlowEdge = z.infer<typeof flowEdgeContract>;
