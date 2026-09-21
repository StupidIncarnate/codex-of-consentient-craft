/**
 * PURPOSE: A planner's whole forecast for one operation item, fully validated — the batches of
 * pieces it hands over, the per-family payload each piece carries, and the marks the planner itself
 * is allowed to write. Reach for THIS export whenever a plan is being accepted or read back; reach
 * for `workPlanFieldsContract` (its sibling folder) only when you need `.omit()`/`.shape`, which
 * `.superRefine()` strips by returning a `ZodEffects`.
 *
 * USAGE:
 * workPlanContract.parse(submittedPlan);
 * // Returns: WorkPlan — or throws naming the piece and the unit that broke
 *
 * A PLAN IS A FILE RATHER THAN PROMPT TEXT BECAUSE A PIECE HAS NO SIZE CEILING AND A PROMPT DOES.
 * `mcpToolResultStatics.maxVerbatimChars` is 50,000 and today's role prompts already run 43,000 to
 * 48,000, so folding a plan back into the prompt pushes the served text past the MCP layer's verbatim
 * ceiling — where the result spills to a file and the session is handed an error stub instead of its
 * instructions, with nothing reporting a failure.
 *
 * TWO RULES LIVE IN ONE `.superRefine()` CALL, because both need the whole envelope at once:
 *
 * 1. `plannerMarks` may hold `cant-meet` and nothing else, and never on a unit a piece in the same
 *    plan already claims. A planner gets no units; its single exception is recording the off-map
 *    families a short round count cannot cover, or `hostile-input` and `perf` — the quest's only
 *    security and performance coverage anywhere — are silently dropped. The `cant-meet`/`toSettle`
 *    pairing is NOT repeated here: `unitObservationContract` already refuses that, and the colocated
 *    test asserts the refusal reaches this envelope.
 *
 * 2. Each piece's `payload` is checked against the plan's own `family`. `z.discriminatedUnion` cannot
 *    do this — the discriminator lives on the envelope and the thing discriminated lives three levels
 *    down, on each piece — so the check is a `safeParse` per piece against the family's contract.
 *
 * THE 1:1 CHECK BETWEEN `payload.units[]` AND `assignedUnitIds` IS CONDITIONAL ON FAMILY, and
 * `'units' in parsed.data` is the mechanism: siegemaster's payload declares no `units` key at all, so
 * that branch never runs for it. A siege piece's unit IS the walk (or the off-map family), already
 * named by `assignedUnitIds` and `offMapFamily`, with nothing separate to cross-check against —
 * unlike codeweaver's and flowrider's `units[]`, which exist precisely because a FILE or a SPEC can
 * silently drop a unit no test was ever written for. An unconditional check would refuse every siege
 * piece ever written.
 */

import { z } from 'zod';

import { workPlanFieldsContract } from '../work-plan-fields/work-plan-fields-contract';
import { workPlanPayloadCodeweaverContract } from '../work-plan-payload-codeweaver/work-plan-payload-codeweaver-contract';
import { workPlanPayloadFlowriderContract } from '../work-plan-payload-flowrider/work-plan-payload-flowrider-contract';
import { workPlanPayloadSiegemasterContract } from '../work-plan-payload-siegemaster/work-plan-payload-siegemaster-contract';

export const workPlanContract = workPlanFieldsContract.superRefine((plan, ctx) => {
  const claimedUnitIds = new Set(
    plan.batches.flatMap((batch) => batch.pieces.flatMap((piece) => piece.assignedUnitIds)),
  );

  plan.plannerMarks.forEach((mark, index) => {
    if (mark.mark !== 'cant-meet') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['plannerMarks', index, 'mark'],
        message:
          `plannerMarks[${index}]: a planner may only write 'cant-meet', never '${mark.mark}'. A ` +
          `planner gets no units — it may record that no piece will reach unit ` +
          `'${String(mark.unitId)}' this pass, never that one was met.`,
      });
    }

    if (claimedUnitIds.has(mark.unitId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['plannerMarks', index, 'unitId'],
        message:
          `plannerMarks[${index}]: unit '${String(mark.unitId)}' is claimed by a piece in this ` +
          `same plan, so it cannot also carry a planner mark — a unit is either assigned to a ` +
          `session or recorded as uncovered, never both.`,
      });
    }
  });

  const payloadContract = {
    codeweaver: workPlanPayloadCodeweaverContract,
    flowrider: workPlanPayloadFlowriderContract,
    siegemaster: workPlanPayloadSiegemasterContract,
  }[plan.family];

  plan.batches.forEach((batch, batchIndex) => {
    batch.pieces.forEach((piece, pieceIndex) => {
      const path = ['batches', batchIndex, 'pieces', pieceIndex, 'payload'] as const;
      const parsed = payloadContract.safeParse(piece.payload);

      if (!parsed.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [...path],
          message: `piece '${String(piece.id)}': payload does not match the ${plan.family} shape — ${parsed.error.issues
            .map((issue) => issue.message)
            .join('; ')}`,
        });
        // The shape is already wrong, so the 1:1 check below would only add noise on top of it.
        return;
      }

      if ('units' in parsed.data) {
        const payloadUnits = [...parsed.data.units];
        const unitsUnitIds = new Set(payloadUnits.map((unit) => unit.unitId));
        const assignedUnitIds = new Set(piece.assignedUnitIds);
        const missingFromUnits = [...assignedUnitIds].filter((id) => !unitsUnitIds.has(id));
        const extraInUnits = [...unitsUnitIds].filter((id) => !assignedUnitIds.has(id));

        if (missingFromUnits.length > 0 || extraInUnits.length > 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [...path, 'units'],
            message:
              `piece '${String(piece.id)}': payload.units[] holds ${payloadUnits.length} ` +
              `entries for ${piece.assignedUnitIds.length} assignedUnitIds${
                missingFromUnits.length > 0
                  ? ` — '${String(missingFromUnits[0])}' has none`
                  : ` — '${String(extraInUnits[0])}' is in units[] but not assigned`
              }`,
          });
        }
      }
    });
  });
});

export type WorkPlan = z.infer<typeof workPlanContract>;
