/**
 * PURPOSE: Every durable side-channel note of ONE kind, gathered under that kind
 *
 * USAGE:
 * questSummaryNoteGroupContract.parse({
 *   id: 'open-question',
 *   notes: [{ id: 'open-question-anchor-scope', kind: 'open-question', role: 'siegemaster', ... }],
 * });
 * // Returns: QuestSummaryNoteGroup — one element of QuestSummary.noteGroups[]
 *
 * `id` IS THE KIND, so `noteGroups` is an id-bearing array rather than a
 * `Record<QuestNoteKind, QuestNote[]>` — the same reason every other keyed collection on a quest is
 * an array, and the reason a reader can map over it without knowing the kind list at all.
 *
 * A group is emitted for EVERY kind, including the empty ones. The four kinds are four different
 * questions — what nobody answered, what the tooling refused to do, what was consciously left, and
 * where a walk was thrown away — and an empty group is the answer "none of those" rather than the
 * absence of an answer. Dropping empty groups would make "no tooling errors" and "nobody looked"
 * render identically.
 *
 * NOTHING HERE CLOSES A VERIFICATION UNIT. A note is what a role learned that belongs to nobody's
 * verdict; only a sign-off settles a unit, which is why these travel beside the counts and never
 * inside them.
 */

import { z } from 'zod';

import { questNoteContract } from '../quest-note/quest-note-contract';
import { questNoteKindContract } from '../quest-note-kind/quest-note-kind-contract';

export const questSummaryNoteGroupContract = z.object({
  id: questNoteKindContract,
  notes: z
    .array(questNoteContract)
    .default([])
    .describe(
      'Every note of this kind, in the order the quest file carries them. Empty means the quest recorded none of this kind.',
    ),
});

export type QuestSummaryNoteGroup = z.infer<typeof questSummaryNoteGroupContract>;
