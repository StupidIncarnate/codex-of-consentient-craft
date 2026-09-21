/**
 * PURPOSE: One unit's state RIGHT NOW — the observation on the most recent work item that was
 * ASSIGNED it, carried together with the work item and step that said so. Reach for this over
 * `unitMarkChurnEntryContract` when you want the single current answer; that sibling is the whole
 * history, and every mark field on it is nullable because it also has to represent a session that
 * was handed the unit and died without marking it.
 *
 * USAGE:
 * unitCurrentMarkContract.parse({
 *   unitId: 'send-flow:observable:check-badge-count-text',
 *   mark: 'met',
 *   evidence: 'packages/x/src/a-transformer.test.ts:42 — flips to red when the guard returns true',
 *   workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
 *   step: 'work',
 *   at: '2026-01-01T00:00:00.000Z',
 * });
 * // Returns: UnitCurrentMark
 */

import {
  questWorkItemIdContract,
  stepNameContract,
  unitIdContract,
  unitMarkContract,
} from '@dungeonmaster/shared/contracts';
import { z } from 'zod';

export const unitCurrentMarkContract = z.object({
  unitId: unitIdContract,
  mark: unitMarkContract,
  // The three branded strings below are re-declared under the literals `unitObservationContract`
  // already uses rather than imported. A zod brand is structural on the literal, so a re-declaration
  // under the same literal is assignable both ways, and a typo in one is a nominal type nothing
  // satisfies — it fails at the first assignment rather than silently here.
  evidence: z.string().min(1).brand<'MarkEvidence'>(),
  toSettle: z.string().min(1).brand<'ToSettleInstruction'>().optional(),
  workItemId: questWorkItemIdContract,
  // `.optional()` — a chat-role work item runs no step of a family graph and carries none.
  step: stepNameContract.optional(),
  // The moment the unit was SETTLED, taken verbatim off the observation — not the moment the
  // session that settled it ended.
  at: z.string().datetime().brand<'IsoTimestamp'>(),
});

export type UnitCurrentMark = z.infer<typeof unitCurrentMarkContract>;
