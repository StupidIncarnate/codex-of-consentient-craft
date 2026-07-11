/**
 * PURPOSE: Defines a branded string for the orchestration-loop's human-readable work-item queue snapshot
 *
 * USAGE:
 * orchestrationLoopSummaryContract.parse('[orchestration-loop] quest=demo status=in_progress ...');
 * // Returns: OrchestrationLoopSummary branded multi-line string written to stderr each loop iteration
 */

import { z } from 'zod';

export const orchestrationLoopSummaryContract = z.string().brand<'OrchestrationLoopSummary'>();

export type OrchestrationLoopSummary = z.infer<typeof orchestrationLoopSummaryContract>;
