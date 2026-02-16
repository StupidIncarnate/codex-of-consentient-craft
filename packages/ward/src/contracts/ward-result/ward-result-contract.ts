/**
 * PURPOSE: Defines the complete result of a ward run across all check types
 *
 * USAGE:
 * wardResultContract.parse({runId: '1739625600000-a3f1', timestamp: 1739625600000, filters: {}, checks: []});
 * // Returns: WardResult validated object
 */

import { z } from 'zod';
import { runIdContract } from '../run-id/run-id-contract';
import { runFiltersContract } from '../run-filters/run-filters-contract';
import { checkResultContract } from '../check-result/check-result-contract';

export const wardResultContract = z.object({
  runId: runIdContract,
  timestamp: z.number().brand<'Timestamp'>(),
  filters: runFiltersContract,
  checks: z.array(checkResultContract),
});

export type WardResult = z.infer<typeof wardResultContract>;
