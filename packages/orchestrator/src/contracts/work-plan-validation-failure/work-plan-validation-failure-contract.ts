/**
 * PURPOSE: One reason a submitted plan is refused — which piece, which of the nineteen checks, and
 * a message naming the offending value. `workPlanValidateTransformer` returns a LIST of these,
 * never a single string, so story 17 can join and count them without re-deriving wording.
 *
 * USAGE:
 * workPlanValidationFailureContract.parse({
 *   pieceId: 'pc-scan',
 *   check: 5,
 *   message: "pc-scan: assigned unit 'flow-send:observable:x' is not in scope for operation item …",
 * });
 * // Returns: WorkPlanValidationFailure
 *
 * `pieceId` is always populated, even for a check whose OWN wrongness sits on the plan envelope
 * rather than on any one piece (operationItemId, flowId, packageNames, plannerMarks) — a plan-level
 * failure invalidates every piece the plan carries, so the transformer attaches one entry per piece
 * across the whole plan rather than inventing a sentinel id nothing dispatches against.
 */

import { pieceIdContract } from '@dungeonmaster/shared/contracts';
import { z } from 'zod';

import { workPlanValidationCheckContract } from '../work-plan-validation-check/work-plan-validation-check-contract';

export const workPlanValidationFailureContract = z.object({
  pieceId: pieceIdContract,
  check: workPlanValidationCheckContract,
  message: z.string().min(1).brand<'WorkPlanValidationMessage'>(),
});

export type WorkPlanValidationFailure = z.infer<typeof workPlanValidationFailureContract>;
