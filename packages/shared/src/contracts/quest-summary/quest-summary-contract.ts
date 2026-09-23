/**
 * PURPOSE: The whole verification state of one quest in a single readable shape — per-flow, per-track
 * mark counts; the observables that were added after approval and by whom; every unit carrying debt
 * with its evidence and the action that would settle it; and the durable side-channel notes grouped
 * by kind
 *
 * USAGE:
 * questSummaryContract.parse({
 *   questId: 'add-auth',
 *   flows: [{ id: 'login-flow', name: 'Login Flow', flowType: 'runtime', tracks: [...] }],
 *   midQuestObservables: [...],
 *   debt: [...],
 *   noteGroups: [{ id: 'open-question', notes: [...] }],
 * });
 * // Returns: QuestSummary — what `StartOrchestrator.getQuestSummary` hands back
 *
 * THIS ANSWERS "WHAT ACTUALLY HAPPENED ON THIS QUEST", which is not a question `quest.json` answers.
 * A quest reaches `complete` when its operations ledger drains, not when every verification unit is
 * marked `met`: a `cant-meet` settles a unit without proving it, an `unmet` leaves the work open, and
 * neither one holds the ledger. So a complete quest can still carry real holes, real scope that
 * nobody approved, and real unanswered questions, and none of them are visible in a status. Each
 * field here is one of those blind spots:
 *
 * - `flows` is coverage, split per track, because the tracks are independent: a unit proven by a
 *   unit test, a unit proven by a flow-perspective test, and a unit that held when a human drove it
 *   are three different facts and none substitutes for another.
 * - `midQuestObservables` is scope drift — what the quest grew after the user approved a spec that
 *   did not contain it.
 * - `debt` is every unit that is not proven — settled without proof, or still outstanding — with the
 *   evidence behind each and the action that would settle it.
 * - `humanChecks` is every observable flagged `verifyByHuman` across the quest's flows — a criterion
 *   no track's denominator can carry, because only a person can settle it.
 * - `noteGroups` is everything a role learned that belongs to nobody's verdict.
 *
 * EVERY COLLECTION IS AN ID-BEARING ARRAY, never a `Record`. That is the shape the quest deep-merge
 * upserts, the shape the rest of the quest file already uses, and the shape a renderer can map over
 * without hard-coding the key set — so a third track or a fifth note kind extends this without a
 * consumer change.
 *
 * `.strict()`, BECAUSE ITS ONE PRODUCER IS AN OBJECT LITERAL HANDED TO `.parse()`. That argument is
 * `unknown`, so TypeScript grades nothing at the call site, and every collection here carries a
 * `.default([])`. Without `.strict()` a field renamed here and missed there is STRIPPED and its
 * replacement DEFAULTS, so the summary renders as empty coverage with no error raised anywhere — the
 * exact failure this shape exists to expose. A stale key now throws on the first call instead.
 *
 * It lives in `@dungeonmaster/shared` rather than in the orchestrator because BOTH the orchestrator
 * (which computes it) and the web (which renders it) consume the type, and the web depends on
 * `@dungeonmaster/shared` alone. The orchestrator re-exports it from its barrel exactly as it
 * re-exports `getQuestResultContract`, so the MCP package keeps importing it from
 * `@dungeonmaster/orchestrator`.
 */

import { z } from 'zod';

import { questIdContract } from '../quest-id/quest-id-contract';
import { questSummaryDebtContract } from '../quest-summary-debt/quest-summary-debt-contract';
import { questSummaryFlowContract } from '../quest-summary-flow/quest-summary-flow-contract';
import { questSummaryNoteGroupContract } from '../quest-summary-note-group/quest-summary-note-group-contract';
import { questSummaryObservableContract } from '../quest-summary-observable/quest-summary-observable-contract';

export const questSummaryContract = z
  .object({
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
    debt: z
      .array(questSummaryDebtContract)
      .default([])
      .describe(
        'Every unit on the quest that is not proven — `cant-meet` settled it without proof, `unmet` leaves work outstanding — each carried whole so its evidence and its next action travel with it. This is the only place they surface.',
      ),
    humanChecks: z
      .array(questSummaryObservableContract)
      .default([])
      .describe(
        'Every observable flagged `verifyByHuman` across the quest, regardless of track eligibility or origin — a criterion only a person can settle, judged in the browser and recorded as a `human-verdict` note.',
      ),
    noteGroups: z
      .array(questSummaryNoteGroupContract)
      .default([])
      .describe(
        'The durable side-channel notes grouped by kind — one group per kind, empty groups included, so "none recorded" and "nobody looked" do not render the same.',
      ),
  })
  .strict();

export type QuestSummary = z.infer<typeof questSummaryContract>;
