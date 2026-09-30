/**
 * PURPOSE: Defines the complete result of a ward run across all check types
 *
 * USAGE:
 * wardResultContract.parse({runId: '1739625600000-a3f1', timestamp: 1739625600000, filters: {}, checks: []});
 * // Returns: WardResult validated object
 */

import { z } from '#gateway/npm/zod';
import { runFiltersContract } from '../run-filters/run-filters-contract';
import { checkResultContract } from '../check-result/check-result-contract';

export const wardRunResultContract = z.object({
  runId: z.string().regex(/^\d+-[a-f0-9]+$/u, 'Invalid RunId format: expected timestamp-hex pattern').brand<'WardRunResultRunId'>(),
  timestamp: z.number().brand<'WardRunResultTimestamp'>(),
  filters: runFiltersContract,
  checks: z.array(checkResultContract),
  durationMs: z.number().nonnegative().default(0).brand<'WardRunResultDurationMs'>(),
}).brand<'WardRunResult'>();

export type WardRunResult = z.infer<typeof wardRunResultContract>;
