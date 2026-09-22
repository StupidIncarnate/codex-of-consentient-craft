/**
 * PURPOSE: Defines the six kinds of durable side-channel note a role can append to
 * `quest.planningNotes.questNotes`
 *
 * USAGE:
 * questNoteKindContract.parse('open-question');
 * // Returns: QuestNoteKind enum value
 *
 * The first five cover what a role learns that does not belong in a verdict:
 * - `open-question` — a question raised during the work that nobody answered
 * - `tooling-error` — a tool or infrastructure failure that blocked real work from happening
 * - `out-of-scope` — an observation deliberately left out of scope, recorded so it is not re-found
 * - `walk-reset` — a record that a Siegemaster walk was reset for a flow
 * - `walked` — proof that a siegelense path or attack was actually driven, carrying the
 *   `instanceId`/`runId` a `prune`/`cleanup` resolver matches a citation against
 *
 * Keeping those five OUT of the sign-off verdicts is the point: a note never closes a unit, so a
 * role cannot discharge a verification obligation by writing prose about it.
 *
 * `human-verdict` is the deliberate exception, and the sixth kind:
 * - `human-verdict` — a person's outcome on one `verifyByHuman` criterion, naming it in `unitId`
 *   and carrying `outcome` on `questNoteContract`
 *
 * A `verifyByHuman` observable is filtered out of every role's mark surface by design, so
 * `workItem.observations[]` can never carry a verdict for it — a note is the only record a
 * person's judgment has anywhere to live. `unjudgedScreencastLayerBroker` (`@dungeonmaster/siegelense`)
 * is what reads it: a screencast citation for a criterion holds until a `human-verdict` note names
 * that same criterion, which is the one release condition this kind exists to provide.
 */

import { z } from 'zod';

export const questNoteKindContract = z.enum([
  'open-question',
  'tooling-error',
  'out-of-scope',
  'walk-reset',
  'walked',
  'human-verdict',
]);

export type QuestNoteKind = z.infer<typeof questNoteKindContract>;
