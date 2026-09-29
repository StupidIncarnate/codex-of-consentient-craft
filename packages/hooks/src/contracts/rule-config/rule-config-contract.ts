/**
 * PURPOSE: Zod schema for rule configuration with custom display name and message
 *
 * USAGE:
 * const ruleConfig = ruleConfigContract.parse({ rule: 'no-console', displayName: 'No Console' });
 * // Returns validated RuleConfig with rule, optional displayName, optional message
 */
import { z } from '#gateway/npm/zod';
import type { Message } from '../message/message-contract';

// `message` may be a function taking the hook's own data and returning a message — zod cannot
// validate a callback's parameter/return shape (a bare `z.function()` infers `() => unknown`, not
// this specific signature), so `message` lives out of the schema entirely, carried through
// `.loose()` unvalidated (both the string and function forms), and is typed only in the exported
// type below.
export const ruleConfigContract = z
  .object({
    rule: z.string().min(1).brand<'Rule'>(),
    displayName: z.string().brand<'DisplayName'>().optional(),
  })
  .loose();

export type RuleConfig = z.infer<typeof ruleConfigContract> & {
  message?: Message | ((hookData: unknown) => Message) | undefined;
};
