/**
 * PURPOSE: Defines the FlowNode structure for nodes in a flow graph
 *
 * USAGE:
 * flowNodeContract.parse({id: 'login-page', label: 'Login Page', type: 'state', observables: []});
 * // Returns: FlowNode object
 *
 * The two sign-offs are TOP-LEVEL SIBLING fields rather than a nested `signoffs` block, because
 * `questItemDeepMergeTransformer` replaces any non-id-bearing object value WHOLESALE — a nested
 * block would let a Siegemaster write delete Flowrider's sign-off while reporting success, whereas
 * sibling keys merge per-key. They are `.optional()` and not `.default()` because `questModifyBroker`
 * re-parses the whole quest on every write, so defaults would materialise into the persisted JSON of
 * every node that never received a sign-off.
 */

import { z } from 'zod';

import { flowNodeIdContract } from '../flow-node-id/flow-node-id-contract';
import { flowNodeTypeContract } from '../flow-node-type/flow-node-type-contract';
import { flowObservableContract } from '../flow-observable/flow-observable-contract';
import { signoffContract } from '../signoff/signoff-contract';

export const flowNodeContract = z.object({
  id: flowNodeIdContract,
  label: z.string().min(1).brand<'FlowNodeLabel'>(),
  type: flowNodeTypeContract,
  observables: z.array(flowObservableContract).default([]),
  flowriderSignoff: signoffContract.optional(),
  siegemasterSignoff: signoffContract.optional(),
});

export type FlowNode = z.infer<typeof flowNodeContract>;
