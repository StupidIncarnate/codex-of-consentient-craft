/**
 * PURPOSE: Defines the four kinds of durable side-channel note a role can append to
 * `quest.planningNotes.questNotes`
 *
 * USAGE:
 * questNoteKindContract.parse('open-question');
 * // Returns: QuestNoteKind enum value
 *
 * The four kinds cover what a role learns that does not belong in a verdict:
 * - `open-question` — a question raised during the work that nobody answered
 * - `tooling-error` — a tool or infrastructure failure that blocked real work from happening
 * - `out-of-scope` — an observation deliberately left out of scope, recorded so it is not re-found
 * - `walk-reset` — a record that a Siegemaster walk was reset for a flow
 *
 * Keeping these OUT of the sign-off verdicts is the point: a note never closes a unit, so a role
 * cannot discharge a verification obligation by writing prose about it.
 */

import { z } from 'zod';

export const questNoteKindContract = z.enum([
  'open-question',
  'tooling-error',
  'out-of-scope',
  'walk-reset',
]);

export type QuestNoteKind = z.infer<typeof questNoteKindContract>;
