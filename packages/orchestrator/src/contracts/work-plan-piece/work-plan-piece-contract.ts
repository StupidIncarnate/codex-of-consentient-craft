/**
 * PURPOSE: One unit of dispatchable work a planner forecast — which step of its family's graph it
 * runs, which units it must mark, which it may only read, and the family-shaped payload carrying the
 * rest. Reach for this over `operationPlanPieceContract` (`@dungeonmaster/shared/contracts`) by
 * MECHANISM, not by name: that one is a planning sub-agent's spike report on
 * `quest.planningNotes.operationPlans[]`, keyed by UUID, and nothing here touches it.
 *
 * USAGE:
 * workPlanPieceContract.parse({
 *   id: 'pc-scan',
 *   step: 'work',
 *   context: 'the badge reads off the persisted list, not the queue',
 *   payload: { files: [], units: [] },
 * });
 * // Returns: WorkPlanPiece
 *
 * `assignedUnitIds` is what this session must MARK; `contextUnitIds` is what it must READ and build
 * against and may NOT mark. That split is how a seam's far half stays visible to the cell that does
 * not own it, so a scope check binds the assigned list ALONE — a context unit is by definition a unit
 * from somewhere else, and checking it against this scope would reject exactly the case it exists for.
 *
 * `assignedUnitIds` may be EMPTY: a contracts-only piece proves nothing itself, because a contract is
 * proved by the code that reads it.
 *
 * `assignedUnitIds` is INTENT. The router re-filters it against the record at dispatch and writes its
 * decision onto the WORK ITEM's own `assignedUnitIds`, so a gate or a served view counts that field
 * and never re-reads this one. Living in a directory called `planned-work` is what marks this copy as
 * a forecast; the field name does not need to.
 *
 * `payload` is `z.unknown()` HERE deliberately. The piece alone does not know its own family — only
 * the plan envelope's `family` field does — so there is nothing for `z.discriminatedUnion` to key on
 * at this level, and the real per-family check runs once in `workPlanContract`'s own refinement,
 * which has the family and every piece in scope at the same time.
 *
 * `baselineFor` names the happy-walk piece an ADVERSARIAL piece measures against. An attack is an
 * ABSENCE claim — I attacked this and it did not fall over — and an absence is only evidence against
 * a known-good reading taken first, so without this field the antagonist has nothing behind its claim.
 */

import { pieceIdContract, stepNameContract, unitIdContract } from '@dungeonmaster/shared/contracts';
import { z } from 'zod';

import { recipeIdContract } from '../recipe-id/recipe-id-contract';

export const workPlanPieceContract = z.object({
  id: pieceIdContract,
  step: stepNameContract.describe(
    "Which step of this family's graph the piece runs — resolved against that graph by the plan validator, not here.",
  ),
  assignedUnitIds: z
    .array(unitIdContract)
    .default([])
    .describe('The units this piece must MARK. May be empty on a contracts-only piece.'),
  contextUnitIds: z
    .array(unitIdContract)
    .default([])
    .describe('The units this piece must READ and build against, and may NOT mark.'),
  recipeId: recipeIdContract.optional(),
  baselineFor: pieceIdContract
    .optional()
    .describe('Adversarial pieces only — the happy-walk piece this attack measures against.'),
  context: z
    .string()
    .min(1)
    .brand<'PieceContext'>()
    .describe('What a session needs to know before it starts, in the planner’s own words.'),
  notes: z.array(z.string().min(1).brand<'PieceNote'>()).default([]),
  payload: z.unknown(),
});

export type WorkPlanPiece = z.infer<typeof workPlanPieceContract>;
