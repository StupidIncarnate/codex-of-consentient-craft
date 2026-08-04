/**
 * PURPOSE: Defines the five outcomes a blightwarden review unit can carry in
 * `quest.planningNotes.blightLedger`
 *
 * USAGE:
 * blightDispositionContract.parse('reviewed');
 * // Returns: BlightDisposition enum value
 *
 * EVERY member clears a unit deliberately: `reviewed` (the concern was checked and holds), `fixed`
 * (a real defect was found and corrected in place), `routed` (a question the operator cannot
 * resolve alone was put to the user), `recorded` (a real finding was handed to a named owner), and
 * `gap` (the concern cannot be assessed at this layer, with a reason) are all honest answers, so the
 * gate can always be cleared truthfully. What it refuses is the SIXTH state — a unit with no entry
 * at all.
 */

import { z } from 'zod';

export const blightDispositionContract = z.enum(['reviewed', 'fixed', 'routed', 'recorded', 'gap']);

export type BlightDisposition = z.infer<typeof blightDispositionContract>;
