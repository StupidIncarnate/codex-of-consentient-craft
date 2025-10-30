/**
 * PURPOSE: Zod schema for rule configuration with custom display name and message
 *
 * USAGE:
 * const ruleConfig = ruleConfigContract.parse({ rule: 'no-console', displayName: 'No Console' });
 * // Returns validated RuleConfig with rule, optional displayName, optional message
 */
import { z } from 'zod';

export const ruleConfigContract = z.object({
  rule: z.string().min(1).brand<'Rule'>(),
  displayName: z.string().optional(),
  message: z.union([z.string(), z.function().args(z.unknown()).returns(z.string())]).optional(),
});

export type RuleConfig = z.infer<typeof ruleConfigContract>;
