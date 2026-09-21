/**
 * PURPOSE: The bare, unrefined fields of a planner's work plan — which operation item it forecasts,
 * which family will run it, and the batches of pieces it hands over. Reach for THIS export when you
 * need `.omit()`, `.pick()`, `.extend()` or `.shape`; reach for `workPlanContract` (its sibling
 * folder) when you want a fully validated plan. `.superRefine()` returns a `ZodEffects` in zod 3, and
 * a `ZodEffects` carries none of those four, so the inbound-payload shape that drops the two
 * server-stamped fields — `.omit({ writtenBy: true, writtenAt: true })` — is only buildable here.
 *
 * USAGE:
 * workPlanFieldsContract.parse({
 *   operationItemId: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
 *   family: 'codeweaver',
 *   flowId: 'send-flow',
 *   writtenBy: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
 *   writtenAt: '2026-01-01T00:00:00.000Z',
 * });
 * // Returns: WorkPlanFields — batches, packageNames and plannerMarks each default to []
 *
 * A PLAN IS A FILE RATHER THAN PROMPT TEXT BECAUSE A PIECE HAS NO SIZE CEILING AND A PROMPT DOES.
 * `mcpToolResultStatics.maxVerbatimChars` is 50,000 and today's role prompts already run 43,000 to
 * 48,000, so a plan folded back into the prompt would push the served text over the MCP layer's
 * verbatim ceiling — where the result is spilled to a file and the session is handed an error stub
 * instead of its instructions, with nothing reporting a failure. The file has no such bound: a plan
 * grows a batch, a batch grows a piece, and the only cost is disk.
 *
 * NOT `operationPlanContract` / `operationPlanPieceContract` (`@dungeonmaster/shared/contracts`),
 * whose vocabulary collides with this one. Those back `quest.planningNotes.operationPlans[]` — a
 * planning SUB-AGENT's spike report, keyed by UUID — and that mechanism keeps working exactly as it
 * does today. Nothing here imports it, and a piece here is addressed by `pieceIdContract`, a short
 * mnemonic a planner types by hand.
 *
 * `family` is a closed three-member set, distinct from the broader family key elsewhere in this
 * chain: it names WHICH step graph a piece's `step` must resolve against, and only the three operator
 * roles ever write a plan — `riftcarver`, `wardFull` and `warpgate` hold no `plan` step, and the chat
 * roles hold no step graph at all. Its colocated test pins the three against
 * `agentPromptClassificationStatics.operatorRoleNames`.
 *
 * `flowId` is NULLABLE, not optional, and SINGULAR. Every fan-out mints one item per flow, so an item
 * never needs more than one; `null` is a real case rather than a degenerate one — the codeweaver cell
 * for a package that owns a contract by `source` and tags no node anywhere, which `shared` does
 * routinely.
 *
 * `plannerMarks` takes the REFINED `unitObservationContract`, not its bare `unitObservationFields`
 * sibling, so the `cant-meet`/`toSettle` pairing rule reaches a planner's mark instead of being
 * restated here. A `cant-meet` is the planner's whole authority, and one with no `toSettle` is a dead
 * end with no owner — which is the case the bare fields contract would let through. Nothing here
 * needs `.omit()`/`.shape` on a mark, so the reason that split exists does not apply at this field.
 */

import {
  flowIdContract,
  operationItemIdContract,
  packageNameContract,
  questWorkItemIdContract,
  unitObservationContract,
} from '@dungeonmaster/shared/contracts';
import { z } from 'zod';

import { isoTimestampContract } from '../iso-timestamp/iso-timestamp-contract';
import { workPlanBatchContract } from '../work-plan-batch/work-plan-batch-contract';

export const workPlanFieldsContract = z.object({
  operationItemId: operationItemIdContract,
  family: z
    .enum(['codeweaver', 'flowrider', 'siegemaster'])
    .describe('Which step graph this plan’s pieces resolve their `step` against.'),
  flowId: flowIdContract
    .nullable()
    .describe('The one flow this plan covers, or null for a contracts-only cell.'),
  packageNames: z.array(packageNameContract).default([]),
  writtenBy: questWorkItemIdContract.describe(
    'Server-stamped — the work item whose session submitted this plan.',
  ),
  writtenAt: isoTimestampContract.describe('Server-stamped, from the server’s own clock.'),
  batches: z.array(workPlanBatchContract).default([]),
  plannerMarks: z
    .array(unitObservationContract)
    .default([])
    .describe(
      "The planner's ONE mark authority — `cant-meet` only, and only for a unit it is simultaneously putting on no piece.",
    ),
});

export type WorkPlanFields = z.infer<typeof workPlanFieldsContract>;
