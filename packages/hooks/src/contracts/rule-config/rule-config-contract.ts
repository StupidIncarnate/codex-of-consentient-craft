/**
 * PURPOSE: Zod schema for rule configuration with custom display name and message
 *
 * USAGE:
 * const ruleConfig = ruleConfigContract.parse({ rule: 'no-console', displayName: 'No Console' });
 * // Returns validated RuleConfig with rule, optional displayName, optional message
 */
import { z } from '#gateway/npm/zod';

// `message` is a string or a callback taking the hook's own data. zod cannot validate a callback's
// signature, so `z.custom` checks only `typeof === 'function'` and pins the signature by its type
// argument.
const messageFnContract = z.custom<(hookData: unknown) => string>(
  (value) => typeof value === 'function',
);

export const ruleConfigContract = z
  .object({
    rule: z.string().min(1).brand<'RuleConfigRule'>(),
    displayName: z.string().brand<'RuleConfigDisplayName'>().optional(),
    message: z.union([z.string().brand<'RuleConfigMessage'>(), messageFnContract]).optional(),
  })
  .loose()
  .brand<'RuleConfig'>();

export type RuleConfig = z.infer<typeof ruleConfigContract>;
