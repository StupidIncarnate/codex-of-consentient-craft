/**
 * PURPOSE: One group of plan pieces and how they are to be run against each other — all at once, or
 * one after the next. Reach for this rather than putting a `dependsOn` on each piece: the ORDER a
 * planner forecasts is a property of the group, and a per-piece edge list would let a planner draw a
 * graph the router has no way to honour.
 *
 * USAGE:
 * workPlanBatchContract.parse({ mode: 'parallel', pieces: [piece] });
 * // Returns: WorkPlanBatch
 *
 * `pieces` is `.min(1)` — an empty batch forecasts nothing and would silently widen a plan's batch
 * count without adding a single dispatchable piece.
 */

import { z } from 'zod';

import { workPlanPieceContract } from '../work-plan-piece/work-plan-piece-contract';

export const workPlanBatchContract = z.object({
  mode: z
    .enum(['sequential', 'parallel'])
    .describe('Whether this batch’s pieces run one after the next, or all at once.'),
  pieces: z.array(workPlanPieceContract).min(1),
});

export type WorkPlanBatch = z.infer<typeof workPlanBatchContract>;
