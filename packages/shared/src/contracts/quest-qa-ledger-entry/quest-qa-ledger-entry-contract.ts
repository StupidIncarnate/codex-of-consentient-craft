/**
 * PURPOSE: Defines one disposition in `quest.planningNotes.qaLedger` — the durable record that a
 * specific QA checklist unit was actually dealt with, by whom, with what measured value
 *
 * USAGE:
 * questQaLedgerEntryContract.parse({
 *   itemId: 'view-persisted-comments:observable:check-badge-count-text',
 *   disposition: 'walked',
 *   evidence: 'COMMENT_COUNT_BADGE rendered the string "2"',
 *   brokenWouldShow: 'would read "1" if the badge counted the node rather than the assertion card',
 *   observedBy: 'walker slice 3',
 *   workItemId: '...', createdAt: '...',
 * });
 * // Returns: QuestQaLedgerEntry — one entry in quest.planningNotes.qaLedger[]
 *
 * This exists so completion is COMPUTED rather than remembered. A Siegemaster session holds its
 * coverage in working context, and a long serial run degrades that context long before the flow is
 * finished — which is how a pass walks part of a flow and reports done. Keying dispositions on the
 * derived `QaChecklistItemId` means a later session resumes against what actually landed instead of
 * re-deriving a predecessor's pass from prose in a commit body.
 *
 * `evidence` is required on every disposition and is never an adjective: for `walked`/`fixed` it is
 * the value read off the running system, and for `gap`/`recorded`/`routed`/`unconfirmed` it is the
 * specific reason. `brokenWouldShow` is the falsifiability check — a measurement whose result was
 * fixed by construction proves nothing, so an entry that cannot name a different value a broken
 * system would have produced is the shape a reviewer should reject.
 */

import { z } from 'zod';

import { qaChecklistItemIdContract } from '../qa-checklist-item-id/qa-checklist-item-id-contract';
import { qaDispositionContract } from '../qa-disposition/qa-disposition-contract';
import { questWorkItemIdContract } from '../quest-work-item-id/quest-work-item-id-contract';
import { repoRelativePathContract } from '../repo-relative-path/repo-relative-path-contract';

export const questQaLedgerEntryContract = z.object({
  itemId: qaChecklistItemIdContract,
  disposition: qaDispositionContract,
  evidence: z
    .string()
    .min(1)
    .brand<'QaEvidence'>()
    .describe(
      'The measured value read off the running system, or — for gap/recorded/routed/unconfirmed — the specific reason. Never an adjective: "confirmed", "held", "as expected" are the report grading itself.',
    ),
  brokenWouldShow: z
    .string()
    .min(1)
    .brand<'QaBrokenWouldShow'>()
    .optional()
    .describe(
      'The specific different value a broken system would have produced. Absent means the measurement was not shown to be falsifiable.',
    ),
  observedBy: z
    .string()
    .min(1)
    .brand<'QaObservedBy'>()
    .describe('Who produced this — the operator itself, or the minion slice that reported it.'),
  owner: z
    .string()
    .min(1)
    .brand<'QaDeferralOwner'>()
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

export type QuestQaLedgerEntry = z.infer<typeof questQaLedgerEntryContract>;
