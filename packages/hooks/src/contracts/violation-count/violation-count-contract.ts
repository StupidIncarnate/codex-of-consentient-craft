/**
 * PURPOSE: Zod schema for violation count by rule with details
 *
 * USAGE:
 * const violationCount = violationCountContract.parse(countData);
 * // Returns validated ViolationCount with ruleId, count, and details array
 */
import { z } from 'zod';
import { violationDetailContract } from '../violation-detail/violation-detail-contract';

export const violationCountContract = z.object({
  ruleId: z.string().min(1).brand<'RuleId'>(),
  count: z.number().int().nonnegative().brand<'ViolationCountNum'>(),
  details: z.array(violationDetailContract),
});

export type ViolationCount = z.infer<typeof violationCountContract>;
