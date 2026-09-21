/**
 * PURPOSE: The `id` of the planner's piece a work item is executing, verbatim from the plan
 * file (e.g. `"pc-1"`, `"pc-walk-1"`). A short mnemonic string a planner writes by hand, never
 * a UUID — do NOT reuse or model this on `operationPlanPieceIdContract`
 * (`z.string().uuid().brand<'OperationPlanPieceId'>()`), which is a strict UUID for the OLD
 * operation-plan system's pieces and would reject every real value here. The pair (the
 * `operations/<id>` entry in `relatedDataItems`, this id) is what addresses a piece — the ref
 * names the plan file, this names the piece inside it.
 *
 * USAGE:
 * pieceIdContract.parse('pc-1');
 * // Returns a branded PieceId
 */

import { z } from 'zod';

export const pieceIdContract = z.string().min(1).brand<'PieceId'>();

export type PieceId = z.infer<typeof pieceIdContract>;
