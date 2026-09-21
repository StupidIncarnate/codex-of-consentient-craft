/**
 * PURPOSE: Records one session's mark against one unit — which unit, what mark, the evidence behind
 * it, and (only on `cant-meet`) the action that would settle it. This is the single record every
 * later role reads or writes instead of the three separate sign-off tracks.
 *
 * USAGE:
 * unitObservationContract.parse({
 *   unitId: 'send-flow:observable:check-badge-count-text',
 *   mark: 'met',
 *   evidence: 'packages/x/src/a-transformer.test.ts:42 — flips to red when the guard returns true',
 *   at: '2026-01-01T00:00:00.000Z',
 * });
 * // Returns: UnitObservation
 *
 * Refines `unitObservationFieldsContract` (its sibling folder) with the cant-meet/toSettle pairing
 * rule. Reach for THIS export when you want a fully validated observation; reach for the fields
 * contract instead when you need `.omit()`/`.shape` — see that file's own header for why.
 */

import { z } from 'zod';

import { unitObservationFieldsContract } from '../unit-observation-fields/unit-observation-fields-contract';

export const unitObservationContract = unitObservationFieldsContract.superRefine((value, ctx) => {
  if (value.mark === 'cant-meet' && value.toSettle === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['toSettle'],
      message:
        "toSettle is required when mark is 'cant-meet' — it names the action that WOULD settle " +
        'this unit. Without one, cant-meet is a dead end with no owner.',
    });
  }
  if (value.mark !== 'cant-meet' && value.toSettle !== undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['toSettle'],
      message:
        "toSettle is only valid when mark is 'cant-meet'. 'met' has already settled the unit; " +
        "'unmet' means work remains, not that this layer gave up on it — either way, a toSettle " +
        'here reads as a claim this observation did not make.',
    });
  }
});

export type UnitObservation = z.infer<typeof unitObservationContract>;
