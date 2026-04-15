/**
 * PURPOSE: Defines the PlanningSurfaceReport structure — a minion's slice-scoped report written during seek_synth
 *
 * USAGE:
 * planningSurfaceReportContract.parse({id: 'f47...', sliceName: 'auth-slice', packages: ['web'], ..., rawReport: '# ...', submittedAt: '2024-...'});
 * // Returns: PlanningSurfaceReport object — one entry in quest.planningNotes.surfaceReports[]
 */

import { z } from 'zod';

import { flowIdContract } from '../flow-id/flow-id-contract';
import { observableIdContract } from '../observable-id/observable-id-contract';
import { packageNameContract } from '../package-name/package-name-contract';

export const planningSurfaceReportContract = z.object({
  id: z.string().uuid().brand<'PlanningSurfaceReportId'>(),
  sliceName: z.string().min(1).brand<'SliceName'>(),
  packages: z.array(packageNameContract).min(1),
  flowIds: z.array(flowIdContract).default([]),
  observableIds: z.array(observableIdContract).default([]),
  rawReport: z.string().min(1).brand<'PlanningReportBody'>(),
  submittedBy: z.string().brand<'AgentSessionId'>().optional(),
  submittedAt: z.string().datetime().brand<'IsoTimestamp'>(),
});

export type PlanningSurfaceReport = z.infer<typeof planningSurfaceReportContract>;
