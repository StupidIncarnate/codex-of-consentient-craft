/**
 * PURPOSE: Defines the six outcomes a QA checklist unit can carry in `quest.planningNotes.qaLedger`
 *
 * USAGE:
 * qaDispositionContract.parse('walked');
 * // Returns: QaDisposition enum value
 *
 * EVERY member satisfies the signal-back completion gate, deliberately: `gap` (unreachable at any
 * surface available to this session) and `recorded` (real defect handed to a named owner) are
 * honest answers, so the gate can always be cleared truthfully. What it refuses is the SEVENTH
 * state — a unit with no entry at all, which is the shape of "walked two flows and reported done".
 */

import { z } from 'zod';

export const qaDispositionContract = z.enum([
  'walked',
  'fixed',
  'routed',
  'recorded',
  'gap',
  'unconfirmed',
]);

export type QaDisposition = z.infer<typeof qaDispositionContract>;
