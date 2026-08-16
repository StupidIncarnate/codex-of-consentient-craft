/**
 * PURPOSE: One unit of work in an operation plan — the artifact a planner sub-agent writes so a
 * worker sub-agent, or the orchestrator reading the plan back, knows exactly what to touch, why,
 * and how to tell it is done, without either agent holding the whole plan in context
 *
 * USAGE:
 * operationPlanPieceContract.parse({
 *   id: 'b2c3d4e5-58cc-4372-a567-0e02b2c3d479',
 *   title: 'Branded id contract',
 *   intent: 'operationPlanPieceIdContract exists, is branded, and round-trips through its stub',
 *   files: ['./src/contracts/operation-plan-piece-id/operation-plan-piece-id-contract.ts'],
 *   folderTypes: ['contracts'],
 * });
 * // Returns: OperationPlanPiece object
 */

import { z } from 'zod';

import { filePathContract } from '../file-path/file-path-contract';
import { operationPlanPieceIdContract } from '../operation-plan-piece-id/operation-plan-piece-id-contract';

export const operationPlanPieceContract = z.object({
  id: operationPlanPieceIdContract.describe(
    "Identity for this piece within the plan. Another piece's dependsOn[] references this id to " +
      'order dispatch — the piece that owns a shared file or contract another piece builds on gets ' +
      'referenced there so a worker never starts against something not yet on disk.',
  ),
  title: z
    .string()
    .min(1)
    .brand<'OperationPlanPieceTitle'>()
    .describe(
      'Short label for this piece — the line scanned first when skimming the plan. Keep it to a ' +
        'few words; the full explanation belongs in intent, not here.',
    ),
  intent: z
    .string()
    .min(1)
    .brand<'OperationPlanPieceIntent'>()
    .describe(
      'What must be TRUE when this piece is done — the acceptance condition a worker checks before ' +
        'signaling complete, not a restatement of the task. "Add a contract" is a task; ' +
        '"operationPlanPieceIdContract parses a uuid and rejects anything else" is an intent. A ' +
        'worker that cannot tell whether it is finished from this sentence alone will either stop ' +
        "early or keep polishing past the piece's actual scope.",
    ),
  files: z
    .array(filePathContract)
    .default([])
    .describe(
      'The explicit paths this piece owns — every file the worker is expected to create or edit to ' +
        'satisfy intent. Empty means the piece is pure research/spike work with no file ownership. ' +
        'A piece that touches files without declaring them here risks two pieces racing on the same ' +
        'path with neither aware of the other.',
    ),
  folderTypes: z
    .array(z.string().min(1).brand<'OperationPlanPieceFolderType'>())
    .default([])
    .describe(
      'The repo folder type(s) touched by files above — brokers, contracts, adapters, widgets, and ' +
        'so on — so the worker knows which get-folder-detail call to make before writing instead of ' +
        'guessing the convention from a bare path. Empty is normal when files is empty or the piece ' +
        'is cross-cutting.',
    ),
  unitIds: z
    .array(z.string().min(1).brand<'OperationPlanPieceUnitId'>())
    .default([])
    .describe(
      'Verification-checklist unit ids this piece settles once done — QaChecklistItemId values from ' +
        'get-qa-checklist or BlightChecklistItemId values from get-blight-checklist. Lets the ' +
        'dispatching session confirm coverage against the checklist without re-deriving which units ' +
        'this piece was meant to close.',
    ),
  dependsOn: z
    .array(operationPlanPieceIdContract)
    .default([])
    .describe(
      'Other piece ids in THIS plan that must land first. Orders dispatch within the plan — a piece ' +
        'listing a dependency should not start until every id here reports status done, so a worker ' +
        'never builds against a file or contract another piece has not written yet.',
    ),
  mirror: filePathContract
    .optional()
    .describe(
      'An existing sibling file whose shape this piece should follow — the nearest analogous file ' +
        'already in the repo. Absent means the planner found no close precedent, so the worker is ' +
        'inventing shape from house conventions alone, which is riskier and worth flagging back if ' +
        'one turns out to exist.',
    ),
  notes: z
    .string()
    .min(1)
    .brand<'OperationPlanPieceNotes'>()
    .optional()
    .describe(
      "Free-form findings from the planner's spike — gotchas, dead ends already ruled out, naming " +
        'collisions to avoid. Absent means the planner found nothing worth flagging beyond intent ' +
        'and mirror.',
    ),
  status: z
    .enum(['pending', 'done', 'rejected'])
    .default('pending')
    .describe(
      'pending: not yet dispatched or in flight. done: a worker signaled intent satisfied. ' +
        'rejected: the orchestrator or a review pass decided this piece is no longer needed or was ' +
        'wrong as scoped — read notes for why before reusing the id.',
    ),
});

export type OperationPlanPiece = z.infer<typeof operationPlanPieceContract>;
