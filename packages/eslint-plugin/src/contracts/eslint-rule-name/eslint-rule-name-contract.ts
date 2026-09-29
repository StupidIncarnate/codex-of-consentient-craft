/**
 * PURPOSE: A plugin-qualified ESLint rule name (e.g. `'@typescript-eslint/no-explicit-any'`), the
 * key of a flat config's `rules` record. A caller with a known rule name parses it through this
 * contract.
 *
 * USAGE:
 * eslintRuleNameContract.parse('@typescript-eslint/no-explicit-any');
 * // Returns a branded EslintRuleName
 */
import { z } from '#gateway/npm/zod';

export const eslintRuleNameContract = z.string().brand<'EslintRuleName'>();

export type EslintRuleName = z.infer<typeof eslintRuleNameContract>;
