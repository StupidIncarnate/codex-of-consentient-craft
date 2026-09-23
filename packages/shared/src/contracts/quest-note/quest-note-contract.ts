/**
 * PURPOSE: Defines one durable side-channel note in `quest.planningNotes.questNotes` — what a role
 * learned that belongs to nobody's verdict, plus the one verdict only a person can give
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
 * `summary` is the one line a reader scans; `detail` is what the next session needs to act on it —
 * on a `human-verdict` note, `detail` IS the reason behind `outcome`, so no separate reason field
 * exists.
 *
 * `instanceId` and `runId` are `.nullish()`, not `.optional()` — this contract also parses
 * `quest.json` straight off disk (via `questContract`'s `planningNotes.questNotes` array), not only
 * a value this file just built, so it accepts an explicit `null` the same as plain omission rather
 * than rejecting a file that carries one. They carry no kind restriction here: every existing note
 * kind has always parsed with them absent, and only a `walked` note is expected to set them. Typed
 * fields rather than prose in `detail` is the whole point — a `WALKED` line is one of the citations
 * `prune` and `cleanup` refuse to delete evidence over, and a resolver cannot match an id buried in
 * a sentence. They are the SHARED-side brand (`siegeInstanceIdContract`/`siegeRunIdContract`, not
 * siegelense's own) — see those contracts' headers for why shared cannot import siegelense's.
 *
 * `workItemId` IS `.nullish()` FOR THE SAME REASON, AND FOR ONE KIND ALONE: `human-verdict`. Every
 * other kind is written by an execution agent's own work item and always carries one — that write
 * path (`quest-work-input-contract.ts`, `modify-quest-input-contract.ts`) still requires it at its
 * own input contract, unaffected by the widening here. A `human-verdict` note is different: it
 * records a PERSON's judgment from the browser, and a person clicking a button has no work item.
 * Omitting the field entirely is the honest shape: a reader checks presence instead of comparing
 * against a magic constant it has to know about.
 *
 * `outcome` is the WIDENING this file carries for `human-verdict`. A `verifyByHuman` observable is
 * filtered out of every role's mark surface by design, so `workItem.observations[]` — the
 * `met`/`cant-meet`/`unmet` vocabulary a role writes — can never carry a verdict for one; this note
 * kind is the only place a person's judgment on such a criterion has anywhere to live. It is its
 * own closed two-way set rather than a reuse of `unitMarkContract`: a person's final say on a
 * criterion never "mints a successor" the way an `unmet` mark does, so that third value has nothing
 * to mean here. `unitId` on a `human-verdict` note carries the OBSERVABLE id the person judged.
 *
 * NO `.superRefine()` PAIRS `outcome`/`unitId` WITH `kind: 'human-verdict'`, unlike
 * `unitObservationContract`'s `toSettle`/`cant-meet` pairing. This contract carries no refinement
 * because two live callers reach through the PLAIN `ZodObject` this export already is:
 * `modify-quest-input-contract.ts` calls `questNoteContract.extend(...)` and
 * `quest-work-input-contract.ts` reads `questNoteContract.shape.detail` — both members `zod` 3
 * removes the moment a schema gains a refinement (`.superRefine()` returns a `ZodEffects`, which
 * carries neither). The pairing is therefore documented, not enforced, the same as `instanceId` and
 * `runId` above.
 */

import { z } from 'zod';

import { flowIdContract } from '../flow-id/flow-id-contract';
import { questNoteIdContract } from '../quest-note-id/quest-note-id-contract';
import { questNoteKindContract } from '../quest-note-kind/quest-note-kind-contract';
import { questWorkItemIdContract } from '../quest-work-item-id/quest-work-item-id-contract';
import { siegeInstanceIdContract } from '../siege-instance-id/siege-instance-id-contract';
import { siegeRunIdContract } from '../siege-run-id/siege-run-id-contract';

export const questNoteContract = z.object({
  id: questNoteIdContract,
  kind: questNoteKindContract,
  role: z
    .string()
    .min(1)
    .brand<'QuestNoteRole'>()
    .describe('The role that appended this note — who a reader follows up with.'),
  workItemId: questWorkItemIdContract
    .nullish()
    .describe(
      'The work item that appended this note. Required on every kind but `human-verdict`, whose ' +
        "note records a person's judgment from the browser — nobody's work item. `.nullish()` " +
        'because this contract also parses `quest.json` straight off disk, not only a fresh write.',
    ),
  flowId: flowIdContract
    .optional()
    .describe('Present when the note is scoped to one flow. Absent means quest-wide.'),
  unitId: z
    .string()
    .min(1)
    .brand<'QuestNoteUnitId'>()
    .optional()
    .describe(
      'Present when the note is scoped to one verification unit within the flow. Required on a ' +
        '`human-verdict` note, where it names the `verifyByHuman` observable the person judged.',
    ),
  instanceId: siegeInstanceIdContract
    .nullish()
    .describe(
      'The siegelense driver instance that walked this path. Present on a `walked` note; absent on ' +
        'every other kind. `.nullish()` because this contract also parses `quest.json` straight off ' +
        'disk, not only a fresh write.',
    ),
  runId: siegeRunIdContract
    .nullish()
    .describe(
      'The run, within `instanceId`, that walked this path. Present exactly when `instanceId` is — ' +
        'together they are what `prune` and `cleanup` resolve a `WALKED` citation against.',
    ),
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
  outcome: z
    .enum(['met', 'not-met'])
    .brand<'QuestNoteVerdictOutcome'>()
    .optional()
    .describe(
      "A person's outcome on the `verifyByHuman` criterion named by `unitId`. Present on a " +
        '`human-verdict` note; absent on every other kind, which settle nothing.',
    ),
});

export type QuestNote = z.infer<typeof questNoteContract>;
