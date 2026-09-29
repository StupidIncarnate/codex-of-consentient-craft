/**
 * PURPOSE: Zod schema for rule configuration with custom display name and message
 *
 * USAGE:
 * const ruleConfig = ruleConfigContract.parse({ rule: 'no-console', displayName: 'No Console' });
 * // Returns validated RuleConfig with rule, optional displayName, optional message
 */
import { z } from '#gateway/npm/zod';
import { messageContract } from '../message/message-contract';
import type { Message } from '../message/message-contract';

// `message` is a string or a callback taking the hook's own data. zod cannot validate a callback's
// signature, so `z.custom` checks only `typeof === 'function'` and pins the signature by its type
// argument.
const messageFnContract = z.custom<(hookData: unknown) => Message>(
  (value) => typeof value === 'function',
);

export const ruleConfigContract = z
  .object({
    rule: z.string().min(1).brand<'Rule'>(),
    displayName: z.string().brand<'DisplayName'>().optional(),
    message: z.union([messageContract, messageFnContract]).optional(),
  })
  .loose();

export type RuleConfig = z.infer<typeof ruleConfigContract>;
