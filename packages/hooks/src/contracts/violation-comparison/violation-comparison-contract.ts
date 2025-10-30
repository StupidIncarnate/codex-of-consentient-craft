/**
 * PURPOSE: Zod schema for violation comparison result with new violations
 *
 * USAGE:
 * const comparison = violationComparisonContract.parse(comparisonData);
 * // Returns validated ViolationComparison with hasNewViolations flag, newViolations array, optional message
 */
import { z } from 'zod';
import { violationCountContract } from '../violation-count/violation-count-contract';

export const violationComparisonContract = z.object({
  hasNewViolations: z.boolean(),
  newViolations: z.array(violationCountContract),
  message: z.string().optional(),
});

export type ViolationComparison = z.infer<typeof violationComparisonContract>;
