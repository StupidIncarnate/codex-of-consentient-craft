/**
 * PURPOSE: Zod schema for Antigravity PreToolUse hook output decision
 *
 * USAGE:
 * const decision = agyPreToolDecisionContract.parse({ decision: 'allow' });
 * // Returns validated AgyPreToolDecision
 */

import { z } from '#gateway/npm/zod';

export const agyPreToolDecisionContract = z
  .object({
    decision: z.enum(['allow', 'deny', 'ask']),
    reason: z.string().brand<'AgyPreToolDecisionReason'>().optional(),
    overwrite: z.record(z.string(), z.unknown()).optional(),
  })
  .brand<'AgyPreToolDecision'>();

export type AgyPreToolDecision = z.infer<typeof agyPreToolDecisionContract>;
