/**
 * PURPOSE: One row of a unit's history — what ONE work item that was assigned it said about it, or
 * that it said nothing. Reach for this over `unitCurrentMarkContract` when you want every session
 * that ever held the unit rather than the one current answer: the fields a mark would fill are
 * nullable here precisely so a session that was handed the unit and died without marking it still
 * gets a row.
 *
 * USAGE:
 * unitMarkChurnEntryContract.parse({
 *   workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
 *   step: 'work',
 *   mark: 'met',
 *   evidence: 'packages/x/src/a-transformer.test.ts:42 — flips to red when the guard returns true',
 *   toSettle: null,
 *   at: '2026-01-01T00:00:00.000Z',
 * });
 * // Returns: UnitMarkChurnEntry
 */

import {
  questWorkItemIdContract,
  stepNameContract,
  unitMarkContract,
} from '@dungeonmaster/shared/contracts';
import { z } from 'zod';

export const unitMarkChurnEntryContract = z.object({
  workItemId: questWorkItemIdContract,
  // `.nullable()` throughout, not `.optional()` — a work item assigned this unit that never marked
  // it is exactly the row this walk exists to show, so the entry is emitted with an explicit null
  // rather than dropped.
  step: stepNameContract.nullable(),
  mark: unitMarkContract.nullable(),
  // The three branded strings here are re-declared under the literals `unitObservationContract`
  // already uses rather than imported. A zod brand is structural on the literal, so a
  // re-declaration under the same literal is assignable both ways, and a typo in one is a nominal
  // type nothing satisfies — it fails at the first assignment rather than silently here.
  evidence: z.string().min(1).brand<'MarkEvidence'>().nullable(),
  // `toSettle` rides on the entry because a `cant-meet` without its instruction renders as a dead
  // end with no owner, and this walk is the surface a human reads it off.
  toSettle: z.string().min(1).brand<'ToSettleInstruction'>().nullish(),
  at: z.string().datetime().brand<'IsoTimestamp'>(),
});

export type UnitMarkChurnEntry = z.infer<typeof unitMarkChurnEntryContract>;
