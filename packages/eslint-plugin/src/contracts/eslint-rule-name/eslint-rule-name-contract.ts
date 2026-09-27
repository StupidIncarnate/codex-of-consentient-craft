/**
 * PURPOSE: A key into `eslintRulesContract`'s record — a plugin-qualified ESLint rule name (e.g.
 * `'@typescript-eslint/no-explicit-any'`). A caller reading or writing a known rule name re-parses
 * it through this contract to index or write the branded `Record` that field returns.
 *
 * USAGE:
 * eslintRuleNameContract.parse('@typescript-eslint/no-explicit-any');
 * // Returns a branded EslintRuleName
 */
import { z } from 'zod';

export const eslintRuleNameContract = z.string().brand<'EslintRuleName'>();

export type EslintRuleName = z.infer<typeof eslintRuleNameContract>;
