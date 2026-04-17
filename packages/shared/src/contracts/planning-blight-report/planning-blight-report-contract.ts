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
  status: z.enum(['active', 'resolved', 'blocking-carry']),
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
