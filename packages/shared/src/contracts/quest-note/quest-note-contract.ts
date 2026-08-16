/**
 * PURPOSE: Defines one durable side-channel note in `quest.planningNotes.questNotes` — what a role
 * learned that belongs to nobody's verdict
 *
 * USAGE:
 * questNoteContract.parse({
 *   id: 'open-question-comment-anchor-scope',
 *   kind: 'open-question',
 *   role: 'siegemaster',
 *   workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
 *   summary: 'Should a stale anchor notify per box or once per batch?',
 *   detail: 'The batch send drops boxes whose node id no longer exists in the flow.',
 *   at: '2026-01-01T00:00:00.000Z',
 * });
 * // Returns: QuestNote — one entry in quest.planningNotes.questNotes[]
 *
 * `id` exists so the note can be UPSERTED. `questArrayUpsertTransformer` matches entries by `id`;
 * an entry without one is not addressable, so every write of `questNotes` would replace the whole
 * array and drop every note a previous role left behind. The id is what makes the list append-safe
 * across roles that never see each other's context.
 *
 * `flowId` and `unitId` are optional because the scope of a note varies: a tooling error can be
 * quest-wide, a walk-reset is per-flow, and an open question is often about one verification unit.
 * `summary` is the one line a reader scans; `detail` is what the next session needs to act on it.
 */

import { z } from 'zod';

import { flowIdContract } from '../flow-id/flow-id-contract';
import { questNoteIdContract } from '../quest-note-id/quest-note-id-contract';
import { questNoteKindContract } from '../quest-note-kind/quest-note-kind-contract';
import { questWorkItemIdContract } from '../quest-work-item-id/quest-work-item-id-contract';

export const questNoteContract = z.object({
  id: questNoteIdContract,
  kind: questNoteKindContract,
  role: z
    .string()
    .min(1)
    .brand<'QuestNoteRole'>()
    .describe('The role that appended this note — who a reader follows up with.'),
  workItemId: questWorkItemIdContract,
  flowId: flowIdContract
    .optional()
    .describe('Present when the note is scoped to one flow. Absent means quest-wide.'),
  unitId: z
    .string()
    .min(1)
    .brand<'QuestNoteUnitId'>()
    .optional()
    .describe('Present when the note is scoped to one verification unit within the flow.'),
  summary: z
    .string()
    .min(1)
    .brand<'QuestNoteSummary'>()
    .describe('The one line a reader scans in a list of notes.'),
  detail: z
    .string()
    .min(1)
    .brand<'QuestNoteDetail'>()
    .describe('What the next session needs in order to act on the note without re-deriving it.'),
  at: z
    .string()
    .datetime()
    .brand<'IsoTimestamp'>()
    .describe(
      'STAMPED SERVER-SIDE — any client-supplied value is ignored and overwritten at write time. ' +
        'An LLM has no reliable clock: agents writing this field have been observed emitting one ' +
        'identical fabricated timestamp across every note on a quest, and timestamps set in a ' +
        'future that never happened. Required here because a persisted note always carries one; ' +
        'the modify-quest input shape drops the requirement, since the write path supplies it.',
    ),
});

export type QuestNote = z.infer<typeof questNoteContract>;
