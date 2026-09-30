/**
 * PURPOSE: Defines the schema for ESLint rule violations with validation and type-safety
 *
 * USAGE:
 * const violation: RuleViolation = {
 *   node: astNode,
 *   message: 'Expected return type annotation' as RuleViolation['message'],
 *   messageId: 'missingReturnType' as RuleViolation['messageId'],
 *   data: { functionName: 'foo' }
 * };
 * // Returns a validated RuleViolation object that can be reported to ESLint
 */
import { z } from '#gateway/npm/zod';

import { astNodeContract } from '../ast-node/ast-node-contract';

// `fix` and each `suggest[].fix` are functions — a Zod object schema cannot check callability, so
// both stay out of the parse and are attached only through the type intersection below.
// `.loose()` carries `fix` through `.parse()` unvalidated when a real caller supplies one.
export const ruleViolationContract = z
  .object({
    node: astNodeContract,
    message: z.string().min(1).brand<'RuleViolationMessage'>(),
    messageId: z.string().brand<'RuleViolationMessageId'>().optional(),
    data: z.record(z.string(), z.json()).optional(),
  })
  .loose()
  .brand<'RuleViolation'>();

export type RuleViolation = z.infer<typeof ruleViolationContract> & {
  fix?: (...args: unknown[]) => unknown;
  suggest?: readonly { desc: string; fix: (...args: unknown[]) => unknown }[];
};
