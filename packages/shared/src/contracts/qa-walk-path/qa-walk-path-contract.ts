/**
 * PURPOSE: Defines one simple root-to-terminal route through a flow graph — the itinerary a walker
 * is dispatched to drive, in order, with the branch labels it must force along the way
 *
 * USAGE:
 * qaWalkPathContract.parse({
 *   nodeIds: ['queue-has-entries', 'toolbar-visible', 'click-send-batch', 'batch-sent'],
 *   branchLabels: ['1 or more queued', 'clicks send'],
 * });
 * // Returns: QaWalkPath — the terminal is the last entry in nodeIds
 *
 * A path is the ITINERARY; the checklist items on it are the definition of done. They are kept
 * separate deliberately: a flow can be flat (two paths) while carrying twenty observables stacked
 * on one node, and a walker told only "walk this path" would report clean while most of the flow
 * sat unchecked. Coverage is therefore always counted against items, never against paths.
 *
 * Paths are SIMPLE — a node never repeats within one path. That is what makes enumeration
 * terminate on a graph with back-edges (an "insert newline, return to the editor" loop), and it
 * matches what a walker can actually drive in one pass.
 */

import { z } from 'zod';

import { flowNodeIdContract } from '../flow-node-id/flow-node-id-contract';

export const qaWalkPathContract = z.object({
  nodeIds: z
    .array(flowNodeIdContract)
    .min(1)
    .describe(
      'Nodes in drive order, entry first. The last entry is the terminal this path ends at.',
    ),
  branchLabels: z
    .array(z.string().min(1).brand<'QaBranchLabel'>())
    .default([])
    .describe(
      'The labelled decision branches taken along this path, in order — each one a condition the walker must FORCE for real rather than happen upon.',
    ),
  exitsFlow: z
    .boolean()
    .default(false)
    .describe(
      'True when the path ends by crossing into another flow (a `flowId:nodeId` edge target) rather than at a terminal node of this flow.',
    ),
});

export type QaWalkPath = z.infer<typeof qaWalkPathContract>;
