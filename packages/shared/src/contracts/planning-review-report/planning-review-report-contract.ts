/**
 * PURPOSE: Defines the PlanningReviewReport structure — review minion's structured review of PathSeeker's plan
 *
 * USAGE:
 * planningReviewReportContract.parse({signal: 'clean', criticalItems: [], warnings: [], info: [], noveltyConcerns: [], rawReport: '# ...', reviewedAt: '2024-...'});
 * // Returns: PlanningReviewReport object — PathSeeker's Phase 7 output via review minion
 */

import { z } from 'zod';

import { noveltyConcernContract } from '../novelty-concern/novelty-concern-contract';

export const planningReviewReportContract = z.object({
  signal: z.enum(['clean', 'warnings', 'critical']),
  criticalItems: z.array(z.string().min(1).brand<'ReviewIssue'>()).default([]),
  warnings: z.array(z.string().min(1).brand<'ReviewIssue'>()).default([]),
  info: z.array(z.string().min(1).brand<'ReviewIssue'>()).default([]),
  noveltyConcerns: z
    .array(noveltyConcernContract)
    .default([])
    .describe(
      'Novel tech, testing, or pattern usages flagged by the verify-minion. Pathseeker may translate concerns with recommendsExploratory: true into exploratory steps before dependent work runs.',
    ),
  rawReport: z.string().min(1).brand<'PlanningReportBody'>(),
  reviewedBy: z.string().brand<'AgentSessionId'>().optional(),
  reviewedAt: z.string().datetime().brand<'IsoTimestamp'>(),
});

export type PlanningReviewReport = z.infer<typeof planningReviewReportContract>;
