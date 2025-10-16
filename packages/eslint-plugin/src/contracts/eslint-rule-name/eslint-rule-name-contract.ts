import { z } from 'zod';

/**
 * ESLint rule name contract - branded string for ESLint rule names.
 */
export const eslintRuleNameContract = z.string().min(1).brand<'EslintRuleName'>();

export type EslintRuleName = z.infer<typeof eslintRuleNameContract>;
