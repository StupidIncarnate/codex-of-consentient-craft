/**
 * PURPOSE: Zod schema for Antigravity Stop hook output decision
 *
 * USAGE:
 * const decision = agyStopDecisionContract.parse({ decision: 'stop' });
 * // Returns validated AgyStopDecision
 */

import { z } from 'zod';

export const agyStopDecisionContract = z
  .object({
    decision: z.enum(['continue', 'stop']),
    reason: z.string().optional(),
  })
  .brand<'AgyStopDecision'>();

export type AgyStopDecision = z.infer<typeof agyStopDecisionContract>;
