/**
 * PURPOSE: A key into an ESLint config's `rules` record — a plugin-qualified rule name (e.g.
 * `'@typescript-eslint/no-explicit-any'`). A caller reading a known rule by a dynamic string
 * re-parses it through this contract to index the branded `Record` these configs' `rules` field
 * returns.
 *
 * USAGE:
 * eslintRuleNameContract.parse('@typescript-eslint/no-explicit-any');
 * // Returns a branded EslintRuleName
 */
import { z } from '#gateway/npm/zod';

export const eslintRuleNameContract = z.string().brand<'EslintRuleName'>();

export type EslintRuleName = z.infer<typeof eslintRuleNameContract>;
