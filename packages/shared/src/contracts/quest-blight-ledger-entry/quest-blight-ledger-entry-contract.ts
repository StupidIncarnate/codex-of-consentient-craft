/**
 * PURPOSE: Defines one disposition in `quest.planningNotes.blightLedger` — the durable record that a
 * specific standards-review unit was actually dealt with, by whom, with what was observed
 *
 * USAGE:
 * questBlightLedgerEntryContract.parse({
 *   itemId: 'packages/web/src/widgets/quest-chat/quest-chat-widget.tsx:craft',
 *   disposition: 'reviewed',
 *   evidence: 'handleSubmit rethrows the network error with the request url attached',
 *   observedBy: 'reviewer-minion',
 *   workItemId: '...', createdAt: '...',
 * });
 * // Returns: QuestBlightLedgerEntry — one entry in quest.planningNotes.blightLedger[]
 *
 * This exists so coverage is COMPUTED rather than remembered. A review unit is one changed file
 * crossed with one of the five concern families; keying dispositions on the derived `BlightChecklistItemId` means a later
 * session resumes against what a predecessor actually landed instead of re-reviewing the whole diff
 * from a pass whose accuracy degrades as context fills. `itemId` is what the signal-back
 * review-coverage gate reads: an orchestrator role's `done` is refused while any unit its own
 * commits produced carries no entry here. Coverage is keyed on the UNIT, never on the author, so an
 * earlier round's disposition still clears a file a later round touched again — `workItemId` is
 * provenance and a filter for the ledger's readers, not the gate's key.
 *
 * `evidence` is required on every disposition and is never an adjective: for `reviewed`/`fixed` it
 * is the concrete thing observed, and for `gap`/`recorded`/`routed` it is the specific reason.
 * `brokenWouldShow` is the falsifiability check — a measurement whose result was fixed by
 * construction proves nothing, so an entry that cannot name a different value a broken system would
 * have produced is the shape a reviewer should reject.
 */

import { z } from 'zod';

import { blightChecklistItemIdContract } from '../blight-checklist-item-id/blight-checklist-item-id-contract';
import { blightDispositionContract } from '../blight-disposition/blight-disposition-contract';
import { questWorkItemIdContract } from '../quest-work-item-id/quest-work-item-id-contract';
import { repoRelativePathContract } from '../repo-relative-path/repo-relative-path-contract';

export const questBlightLedgerEntryContract = z.object({
  itemId: blightChecklistItemIdContract,
  disposition: blightDispositionContract,
  evidence: z
    .string()
    .min(1)
    .brand<'BlightEvidence'>()
    .describe(
      'The concrete thing observed, or — for gap/recorded/routed — the specific reason. Never an adjective: "looks fine", "confirmed", "as expected" are the report grading itself.',
    ),
  brokenWouldShow: z
    .string()
    .min(1)
    .brand<'BlightBrokenWouldShow'>()
    .optional()
    .describe(
      'The specific different value a broken system would have produced. Absent means the measurement was not shown to be falsifiable.',
    ),
  observedBy: z
    .string()
    .min(1)
    .brand<'BlightObservedBy'>()
    .describe('Who produced this — the operator itself, or the minion lens that reported it.'),
  owner: z
    .string()
    .min(1)
    .brand<'BlightDeferralOwner'>()
    .optional()
    .describe(
      'Required in practice for `recorded`: the named owner a defect was handed to. "Noted for later" with no owner is not a disposition.',
    ),
  rippleSites: z
    .array(repoRelativePathContract)
    .default([])
    .describe(
      'For `fixed`: every other place the same value renders or the same logic runs, that was checked for the identical defect. A fix without a ripple list is half a fix. Repo-relative so the persisted ledger stays portable across machines.',
    ),
  workItemId: questWorkItemIdContract,
  createdAt: z
    .string()
    .datetime()
    .brand<'IsoTimestamp'>()
    .describe(
      'STAMPED SERVER-SIDE — any client-supplied value is ignored and overwritten at write time. ' +
        'An LLM has no reliable clock: agents writing this field have been observed emitting one ' +
        'identical fabricated timestamp across every entry on a quest, and timestamps set in a ' +
        'future that never happened. Required here because a persisted disposition always carries ' +
        'one; the modify-quest input shape drops the requirement, since the write path supplies it.',
    ),
});

export type QuestBlightLedgerEntry = z.infer<typeof questBlightLedgerEntryContract>;
