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
import { z } from 'zod';

// Type-only: extracted so `suggest`'s intersection type below has a name, never parsed as a
// runtime value of its own (`suggest` stays out of the schema — see the header comment on
// `ruleViolationContract`).
const _suggestionDescriptionContract = z.string().min(1).brand<'SuggestionDescription'>();
type SuggestionDescription = z.infer<typeof _suggestionDescriptionContract>;

// `fix` and each `suggest[].fix` are functions — a Zod object schema cannot check callability, so
// both stay out of the parse and are attached only through the type intersection below.
// `.loose()` carries `fix` through `.parse()` unvalidated when a real caller supplies one.
export const ruleViolationContract = z
  .object({
    node: z.unknown(),
    message: z.string().min(1).brand<'ViolationMessage'>(),
    messageId: z.string().brand<'MessageId'>().optional(),
    data: z.record(z.string().brand<'ViolationDataKey'>(), z.unknown()).optional(),
  })
  .loose();

export type RuleViolation = z.infer<typeof ruleViolationContract> & {
  fix?: (...args: unknown[]) => unknown;
  suggest?: readonly { desc: SuggestionDescription; fix: (...args: unknown[]) => unknown }[];
};
