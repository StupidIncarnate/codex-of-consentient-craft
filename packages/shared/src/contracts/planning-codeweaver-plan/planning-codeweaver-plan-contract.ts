/**
 * PURPOSE: Defines the PlanningCodeweaverPlan structure — a Codeweaver work item's living tactical plan
 *
 * USAGE:
 * planningCodeweaverPlanContract.parse({id: '9c4...', sliceName: 'web', logicPlan: [...], delegations: [...], rationale: [...], updatedAt: '2024-...'});
 * // Returns: PlanningCodeweaverPlan object — one entry in quest.planningNotes.codeweaverPlans[], keyed by the codeweaver work item id
 */

import { z } from 'zod';

import { questWorkItemIdContract } from '../quest-work-item-id/quest-work-item-id-contract';

export const planningCodeweaverPlanContract = z.object({
  // The codeweaver work item id. One plan entry per work item; modify-quest upserts on this id so
  // Codeweaver and its helpers patch the same entry as the slice progresses, and a respawned
  // Codeweaver reads it back to resume instead of reconstructing intent from the diff.
  id: questWorkItemIdContract,
  sliceName: z.string().min(1).brand<'SliceName'>(),
  // The logic-to-logic plan Codeweaver authors against the real files at its tactical-plan gate —
  // one directive per entry.
  logicPlan: z.array(z.string().min(1).brand<'CodeweaverLogicPlanStep'>()).default([]),
  // Delegation decisions committed up front at the tactical-plan gate: each isolated/novel piece
  // handed to a helper, plus the helper's outcome once it returns.
  delegations: z
    .array(
      z.object({
        pattern: z.string().min(1).brand<'CodeweaverDelegationPattern'>(),
        status: z.enum(['pending', 'returned', 'pivoted']),
        exampleArtifact: z.string().min(1).brand<'CodeweaverDelegationExample'>().optional(),
        outcome: z.string().min(1).brand<'CodeweaverDelegationOutcome'>().optional(),
      }),
    )
    .default([]),
  // Read-through residue + decisions for a cold respawn or a reviewer: "mirror X", "prefer X over Y
  // because Z". One clause per entry.
  rationale: z.array(z.string().min(1).brand<'CodeweaverPlanRationale'>()).default([]),
  updatedAt: z.string().datetime().brand<'IsoTimestamp'>(),
});

export type PlanningCodeweaverPlan = z.infer<typeof planningCodeweaverPlanContract>;
