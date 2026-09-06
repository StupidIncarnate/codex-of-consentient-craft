/**
 * PURPOSE: Defines the FlowNode structure for nodes in a flow graph
 *
 * USAGE:
 * flowNodeContract.parse({id: 'login-page', label: 'Login Page', type: 'state', packages: ['auth-service'], observables: []});
 * // Returns: FlowNode object
 *
 * The sign-offs are TOP-LEVEL SIBLING fields rather than a nested `signoffs` block, because
 * `questItemDeepMergeTransformer` replaces any non-id-bearing object value WHOLESALE — a nested
 * block would let a Siegemaster write delete Flowrider's sign-off while reporting success, whereas
 * sibling keys merge per-key. They are `.optional()` and not `.default()` because `questModifyBroker`
 * re-parses the whole quest on every write, so defaults would materialise into the persisted JSON of
 * every node that never received a sign-off.
 *
 * `packages` is REQUIRED, with neither `.optional()` nor `.default([])`. An untagged node is a node
 * whose landing site is unknown, which is the hole the field closes — accepting the absence would
 * hand every reader a node it cannot route. `.default([])` fails for the same reason as the
 * sign-offs above and worse: it materialises an empty array into EVERY node of every persisted
 * quest.json on each re-parse, the mistake the sibling `flowObservableContract` records a measured
 * +116% file-size cost for. Required means every node on disk carries a real value.
 *
 * `.strict()` REFUSES an unknown key instead of stripping it, and it is the loud half of the
 * edge-sign-off contract. A node object has nowhere to put `edges` — that array belongs to the FLOW,
 * one level up — but a bare `z.object` drops the key and lets the write report success: measured on
 * one quest, a session that nested `edges` inside a node was answered `{"success": true}` twice and
 * lost two sign-offs, then reported 15 units settled over the 13 actually written. Strict turns that
 * into a parse error naming the key. `modifyQuestInputContract` inherits it through `.extend()`, so
 * the refusal lands on the caller's own payload rather than on a whole-quest re-parse afterwards.
 */

import { z } from 'zod';

import { flowNodeIdContract } from '../flow-node-id/flow-node-id-contract';
import { flowNodeTypeContract } from '../flow-node-type/flow-node-type-contract';
import { flowObservableContract } from '../flow-observable/flow-observable-contract';
import { packageNameContract } from '../package-name/package-name-contract';
import { signoffContract } from '../signoff/signoff-contract';

export const flowNodeContract = z
  .object({
    id: flowNodeIdContract,
    label: z.string().min(1).brand<'FlowNodeLabel'>(),
    type: flowNodeTypeContract,
    packages: z
      .array(packageNameContract)
      .min(1)
      .describe(
        "The packages this node lands in, every one of them also present in quest.packagesAffected. Authored with the node, because the observables that would hint at it do not exist yet. A node carrying more than one is a seam: it spans a package boundary, and it owns the glue verification units no single-package slice can. This list is what routes a node's terminal and branch units, which carry no observable to read a package from.",
      ),
    observables: z.array(flowObservableContract).default([]),
    codeweaverSignoff: signoffContract.optional(),
    flowriderSignoff: signoffContract.optional(),
    siegemasterSignoff: signoffContract.optional(),
  })
  .strict();

export type FlowNode = z.infer<typeof flowNodeContract>;
