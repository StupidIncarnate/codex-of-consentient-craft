/**
 * PURPOSE: The whole verification state of one quest in a single readable shape — per-flow, per-track
 * sign-off counts; the observables that were added after approval and by whom; every `unconfirmable`
 * verdict with its reason and its question; and the durable side-channel notes grouped by kind
 *
 * USAGE:
 * questSummaryContract.parse({
 *   questId: 'add-auth',
 *   flows: [{ id: 'login-flow', name: 'Login Flow', flowType: 'runtime', tracks: [...] }],
 *   midQuestObservables: [...],
 *   unconfirmable: [...],
 *   noteGroups: [{ id: 'open-question', notes: [...] }],
 * });
 * // Returns: QuestSummary — what `StartOrchestrator.getQuestSummary` hands back
 *
 * THIS ANSWERS "WHAT ACTUALLY HAPPENED ON THIS QUEST", which is not a question `quest.json` answers.
 * A quest reaches `complete` when its operations ledger drains, not when its three verification
 * tracks (codeweaver, flowrider, siegemaster) have SIGNED every unit — and `unconfirmable` signs a
 * unit just as `confirmed` does, clearing the absence of a verdict rather than demanding an honest
 * one. So a complete quest can still carry real holes, real scope that nobody approved, and real
 * unanswered questions, and none of them are visible in a status. Each field here is one of those
 * blind spots:
 *
 * - `flows` is coverage, split per track, because the tracks are independent: a unit proven by a
 *   unit test, a unit proven by a flow-perspective test, and a unit that held when a human drove it
 *   are three different facts and none substitutes for another.
 * - `midQuestObservables` is scope drift — what the quest grew after the user approved a spec that
 *   did not contain it.
 * - `unconfirmable` is the debt a settled-not-proven verdict leaves behind, with the question that
 *   would close each item.
 * - `noteGroups` is everything a role learned that belongs to nobody's verdict.
 *
 * EVERY COLLECTION IS AN ID-BEARING ARRAY, never a `Record`. That is the shape the quest deep-merge
 * upserts, the shape the rest of the quest file already uses, and the shape a renderer can map over
 * without hard-coding the key set — so a third track or a fifth note kind extends this without a
 * consumer change.
 *
 * It lives in `@dungeonmaster/shared` rather than in the orchestrator because BOTH the orchestrator
 * (which computes it) and the web (which renders it) consume the type, and the web depends on
 * `@dungeonmaster/shared` alone. The orchestrator re-exports it from its barrel exactly as it
 * re-exports `getQuestResultContract`, so the MCP package keeps importing it from
 * `@dungeonmaster/orchestrator`.
 */

import { z } from 'zod';

import { questIdContract } from '../quest-id/quest-id-contract';
import { questSummaryFlowContract } from '../quest-summary-flow/quest-summary-flow-contract';
import { questSummaryNoteGroupContract } from '../quest-summary-note-group/quest-summary-note-group-contract';
import { questSummaryObservableContract } from '../quest-summary-observable/quest-summary-observable-contract';
import { questSummaryUnconfirmableContract } from '../quest-summary-unconfirmable/quest-summary-unconfirmable-contract';

export const questSummaryContract = z.object({
  questId: questIdContract,
  flows: z
    .array(questSummaryFlowContract)
    .default([])
    .describe(
      'One entry per quest flow, in quest order, each carrying a coverage row for every track that measures it.',
    ),
  midQuestObservables: z
    .array(questSummaryObservableContract)
    .default([])
    .describe(
      'Every observable whose `addedBy` is not `spec` — what the quest grew after approval, and which role wrote it in.',
    ),
  unconfirmable: z
    .array(questSummaryUnconfirmableContract)
    .default([])
    .describe(
      'Every `unconfirmable` sign-off on the quest, with the sign-off carried whole so its evidence and its question travel with it. This is the only place they surface.',
    ),
  noteGroups: z
    .array(questSummaryNoteGroupContract)
    .default([])
    .describe(
      'The durable side-channel notes grouped by kind — one group per kind, empty groups included, so "none recorded" and "nobody looked" do not render the same.',
    ),
});

export type QuestSummary = z.infer<typeof questSummaryContract>;
