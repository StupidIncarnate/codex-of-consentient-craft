/**
 * PURPOSE: Defines one disposition in `quest.planningNotes.blightLedger` — the durable record that a
 * specific blightwarden review unit was actually dealt with, by whom, with what was observed
 *
 * USAGE:
 * questBlightLedgerEntryContract.parse({
 *   itemId: 'packages/web/src/widgets/quest-chat/quest-chat-widget.tsx:coverage',
 *   disposition: 'reviewed',
 *   evidence: 'every branch in handleSubmit has a test: success, validation error, network error',
 *   observedBy: 'blightwarden',
 *   workItemId: '...', createdAt: '...',
 * });
 * // Returns: QuestBlightLedgerEntry — one entry in quest.planningNotes.blightLedger[]
 *
 * This exists so completion is COMPUTED rather than remembered, mirroring
 * `quest.planningNotes.qaLedger`. Blightwarden's review unit is one changed file crossed with one of
 * seven concern families; keying dispositions on the derived `BlightChecklistItemId` means a later
 * session resumes against what a predecessor actually landed instead of re-reviewing the whole diff
 * from a fixpoint pass whose accuracy degrades as context fills.
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
  createdAt: z.string().datetime().brand<'IsoTimestamp'>(),
});

export type QuestBlightLedgerEntry = z.infer<typeof questBlightLedgerEntryContract>;
