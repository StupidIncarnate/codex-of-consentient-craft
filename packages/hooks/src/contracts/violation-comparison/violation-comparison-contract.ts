import { z } from 'zod';
import { violationCountContract } from '../violation-count/violation-count-contract';

export const violationComparisonContract = z.object({
  hasNewViolations: z.boolean(),
  newViolations: z.array(violationCountContract),
  message: z.string().optional(),
});

export type ViolationComparison = z.infer<typeof violationComparisonContract>;
