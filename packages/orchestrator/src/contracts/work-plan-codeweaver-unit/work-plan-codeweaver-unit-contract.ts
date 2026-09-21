/**
 * PURPOSE: One unit a codeweaver piece must settle, as the planner forecast it — the unit's id, its
 * verbatim spec text, the assertion that settles it and the value that turns that assertion red.
 * Reach for this over `workPlanFlowriderUnitContract` when the piece's deliverable is a FILE GROUP
 * proved by unit tests; that sibling carries a layer and a graph target instead, because a flowrider
 * piece's deliverable is a spec file.
 *
 * USAGE:
 * workPlanCodeweaverUnitContract.parse({
 *   unitId: 'send-flow:observable:check-badge-count-text',
 *   kind: 'observable',
 *   observableType: 'ui-state',
 *   text: 'COMMENT_COUNT_BADGE reads 2 on a box carrying two persisted comments',
 *   assert: 'render the widget with two persisted comments and read the badge text',
 *   failsIf: 'the badge reads 0 while two comments are persisted',
 * });
 * // Returns: WorkPlanCodeweaverUnit
 *
 * `kind` is `qaChecklistKindContract` MINUS `off-map`, derived rather than re-typed: an off-map
 * family is a property of the built system rather than of any drawn node, so no unit test beside the
 * code can reach one, and only siegemaster's track is ever measured on them.
 *
 * `failsIf` is separate from `assert` on purpose — an assertion that nothing can turn red is the
 * defect this field exists to catch, and a planner that cannot name the wrong value has not yet
 * worked out what the unit means.
 */

import {
  outcomeTypeContract,
  qaChecklistKindContract,
  unitIdContract,
} from '@dungeonmaster/shared/contracts';
import { z } from 'zod';

export const workPlanCodeweaverUnitContract = z.object({
  unitId: unitIdContract,
  kind: qaChecklistKindContract.exclude(['off-map']),
  observableType: outcomeTypeContract
    .optional()
    .describe("Present on kind: 'observable' only — the outcome type the spec gave it."),
  verifyByReading: z
    .boolean()
    .optional()
    .describe('True on a unit settled by opening a source file rather than by running a test.'),
  text: z
    .string()
    .min(1)
    .brand<'PieceUnitText'>()
    .describe('Verbatim from the spec, never a paraphrase.'),
  assert: z
    .string()
    .min(1)
    .brand<'PieceUnitAssert'>()
    .describe('What the test reads, and off which surface.'),
  failsIf: z
    .string()
    .min(1)
    .brand<'PieceUnitFailsIf'>()
    .describe('The wrong value that turns that assertion red.'),
});

export type WorkPlanCodeweaverUnit = z.infer<typeof workPlanCodeweaverUnitContract>;
