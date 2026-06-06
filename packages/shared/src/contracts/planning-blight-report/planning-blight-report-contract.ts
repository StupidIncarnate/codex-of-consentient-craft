/**
 * PURPOSE: Defines the PlanningBlightReport structure — a Blightwarden minion's whole-diff cross-cutting report
 *
 * USAGE:
 * planningBlightReportContract.parse({id: 'f47...', workItemId: '9c4...', minion: 'security', status: 'active', findings: [...], createdAt: '2024-...', reviewedOn: []});
 * // Returns: PlanningBlightReport object — one entry in quest.planningNotes.blightReports[]
 */

import { z } from 'zod';

import { filePathContract } from '../file-path/file-path-contract';
import { questWorkItemIdContract } from '../quest-work-item-id/quest-work-item-id-contract';

export const planningBlightReportContract = z.object({
  id: z.string().uuid().brand<'PlanningBlightReportId'>(),
  workItemId: questWorkItemIdContract,
  minion: z.enum(['security', 'dedup', 'perf', 'integrity', 'dead-code', 'synthesizer']),
  // `failed` records a minion that could not complete its audit — its work item still terminates
  // non-blocking; the failure detail lives in `note` and the synthesizer reads it and decides.
  status: z.enum(['active', 'resolved', 'blocking-carry', 'failed']),
  // Free-text top-level message: a minion's failure detail when `status: 'failed'`, or the
  // synthesizer's roll-up summary. Per-file specifics stay in structured `findings[]`.
  note: z.string().min(1).brand<'BlightReportNote'>().optional(),
  findings: z
    .array(
      z.object({
        file: filePathContract,
        line: z.number().int().positive().brand<'LineNumber'>(),
        category: z.string().min(1).brand<'BlightFindingCategory'>(),
        evidence: z.string().min(1).brand<'BlightFindingEvidence'>(),
        fixHint: z.string().min(1).brand<'BlightFindingFixHint'>(),
      }),
    )
    .default([]),
  createdAt: z.string().datetime().brand<'IsoTimestamp'>(),
  reviewedOn: z.array(questWorkItemIdContract).default([]),
});

export type PlanningBlightReport = z.infer<typeof planningBlightReportContract>;
