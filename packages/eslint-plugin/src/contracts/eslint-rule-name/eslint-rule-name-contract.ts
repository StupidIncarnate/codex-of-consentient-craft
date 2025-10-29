import { z } from 'zod';

/**
 * ESLint rule name contract - branded string for ESLint rule names.
 *
 * PURPOSE: Validates and brands ESLint rule name strings (non-empty strings)
 *
 * USAGE:
 * const ruleName = eslintRuleNameContract.parse('no-console');
 * // Returns branded EslintRuleName; throws on empty string
 */
export const eslintRuleNameContract = z.string().min(1).brand<'EslintRuleName'>();

export type EslintRuleName = z.infer<typeof eslintRuleNameContract>;
